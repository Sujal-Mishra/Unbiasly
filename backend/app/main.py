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
        biased_score = float(prediction[1]) * 100

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

        semantic_average = (
            semantic_data["loaded_language"] +
            semantic_data["identity_bias"] +
            semantic_data["emotional_framing"] +
            semantic_data["toxicity_risk"]
        ) / 4

        overall_score = max(biased_score, semantic_average)

        if semantic_data.get("bias_type", "NEUTRAL") != "NEUTRAL":
            overall_score += 10

        overall_score = min(100, round(overall_score))

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
