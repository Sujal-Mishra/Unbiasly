from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from concurrent.futures import ThreadPoolExecutor

from app.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.inference import model_manager
from app.services.semantic import gemini_semantic_analysis, build_attention_heatmap

executor = ThreadPoolExecutor(max_workers=4)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model on startup ONCE
    model_manager.load_model()
    yield
    executor.shutdown()

app = FastAPI(title="Unbiasly API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
async def analyze_endpoint(request: AnalyzeRequest):
    text = request.text
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        loop = asyncio.get_running_loop()
        
        # 1. Get BERT probability (CPU Bound)
        prediction = await loop.run_in_executor(
            executor, 
            lambda: model_manager.predict_proba([text])[0]
        )
        # Prediction contains ["neutral", "biased", "toxicity", "insult"].
        # We take the maximum score among all non-neutral classes (biased, toxicity, insult)
        # to determine the model's overall bias/risk score.
        biased_score = max(float(prediction[1]), float(prediction[2]), float(prediction[3])) * 100

        # 2. Get LIME explanation (CPU Bound)
        lime_explanation = await loop.run_in_executor(
            executor,
            lambda: model_manager.explain_text(text)
        )
        
        # 3. Get Semantic Analysis (I/O Bound API call, run in thread to avoid blocking loop)
        semantic_data = await loop.run_in_executor(
            executor,
            lambda: gemini_semantic_analysis(text)
        )
        
        heatmap = build_attention_heatmap(text, lime_explanation)

        # Gating: Extract maximum score from LLM semantic vectors
        llm_max_score = max(
            semantic_data.get("loaded_language", 0),
            semantic_data.get("identity_bias", 0),
            semantic_data.get("emotional_framing", 0),
            semantic_data.get("toxicity_risk", 0)
        )

        # Apply specific gating cases:
        # Case 1: If LLM detects virtually no bias (< 5), force the score to be very low (cap at LLM max score)
        if llm_max_score < 5:
            overall_score = round(llm_max_score)
        
        # Case 2: If both LLM agrees (> 80) and BART agrees (> 70), take the maximum score
        elif llm_max_score > 80 and biased_score > 70:
            overall_score = min(100, round(max(biased_score, llm_max_score)))
            
        # Case 3: For all other intermediate/moderate combinations, use a balanced average
        else:
            overall_score = min(100, round((biased_score + llm_max_score) / 2))

        if overall_score >= 70:
            risk = "HIGH"
        elif overall_score >= 40:
            risk = "MEDIUM"
        else:
            risk = "LOW"

        return AnalyzeResponse(
            bias_detected=overall_score >= 50,
            overall_score=overall_score,
            risk_level=risk,
            semantic_vectors=semantic_data,
            model_interpretation=semantic_data["model_interpretation"],
            attention_heatmap=heatmap,
            sentence_vector={
                "sentence": text,
                "bias_type": semantic_data["bias_type"]
            },
            neutral_rewrite=semantic_data["neutral_rewrite"]
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# --- Serve Static Frontend Files ---
from fastapi.staticfiles import StaticFiles
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
# Check backend parent dir (for local dev: Unbiasly/frontend)
local_frontend = os.path.join(os.path.dirname(os.path.dirname(current_dir)), "frontend")
# Check /app/frontend (for docker build)
docker_frontend = "/app/frontend"

frontend_dir = None
if os.path.exists(docker_frontend):
    frontend_dir = docker_frontend
elif os.path.exists(local_frontend):
    frontend_dir = local_frontend

if frontend_dir:
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="static")

