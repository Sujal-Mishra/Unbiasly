# Project Plan: ML Backend Integration

## Context
The goal is to seamlessly integrate the `hatexplain.py` ML script with the existing Unbiasly AI frontend without altering the frontend UI. We will achieve this by building a clean, modern backend using **FastAPI** (as recommended by the `python-patterns` workflow for ML/AI serving) and wiring the frontend's mock javascript to call this live API.

## Socratic Gate / Open Questions for User
> [!IMPORTANT]
> 1. **Model Weights:** The `hatexplain.py` script trains a LoRA model on the fly and saves it to `./bias_model`. Do you already have these pre-trained weights downloaded, or should the plan include running the training script once to generate them before starting the API server?
> 2. **API Keys:** The script has a hardcoded Gemini API key (`GEMINI_API_KEY`). I will extract this to a `.env` file for security. Are you okay with adding `python-dotenv` to the dependencies?

---

## Task Breakdown & Proposed Architecture

Following `@[/python-patterns]` for a clean ML API structure, we will separate the heavy training logic from the fast inference logic.

### 1. Refactor ML Script (Separation of Concerns)
The current `hatexplain.py` is a monolithic Colab export. We will split it:
- **`backend/ml/train.py`**: Contains the dataset downloading, tokenization, LoRA config, and `WeightedTrainer` logic.
- **`backend/ml/inference.py`**: Contains ONLY the `AutoModelForSequenceClassification` loading from `./bias_model`, LIME initialization, and the `analyze_text()` function.

### 2. Build FastAPI Server
- **`backend/main.py`**: Create a FastAPI application.
- **Endpoint**: `POST /api/v1/analyze`
- **Request Schema (Pydantic)**: `{"text": str}`
- **Async/Sync Handling**: The Gemini API calls (`genai.Client`) are I/O bound, while the BERT model inference is CPU bound. We will run the ML inference in a threadpool to prevent blocking the FastAPI event loop.

### 3. Frontend Wiring (No UI Changes)
- **`frontend/script.js`**: Locate the `generateMockResponse()` function.
- We will replace the hardcoded mock JSON and `setTimeout` with a standard `fetch('http://localhost:8000/api/v1/analyze', { ... })` call.
- The UI will function exactly as it does now, but powered by real data.

### 4. Dependency Management
Create a clean `backend/requirements.txt`:
```text
fastapi
uvicorn
pydantic
torch
transformers
peft
lime
google-genai
python-dotenv
```

---

## Agent Assignments
- **`backend-specialist`**: Responsible for building the FastAPI server, Pydantic schemas, and `.env` setup.
- **`project-planner` / ML Engineer**: Responsible for refactoring `hatexplain.py` into clean `train.py` and `inference.py` modules.
- **`frontend-specialist`**: Responsible for swapping the mock JS function with the real `fetch` call without touching the UI layout.

---

## Verification Checklist (Phase X)
- [ ] Backend starts successfully via `uvicorn main:app --reload`.
- [ ] Backend successfully loads the LoRA `./bias_model` into memory on startup.
- [ ] `POST /api/v1/analyze` returns valid JSON matching the schema.
- [ ] Frontend successfully hits the API and renders the Attention Heatmap and Metrics accurately.
