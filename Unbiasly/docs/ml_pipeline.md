# 🤖 Unbiasly AI - Machine Learning Pipeline & Explainability

Unbiasly AI leverages an advanced, highly specialized hybrid machine learning architecture. It combines **local GPU/CPU-bound zero-shot deep classification** with **model-agnostic explainability (LIME)** and **high-reasoning generative heuristics (LLMs)**.

---

## 🧠 Model Specifications

### 1. Base Classifier: BART Zero-Shot Classification
- **Model**: `facebook/bart-large-mnli` (407M Parameters).
- **Domain**: Multi-label classification evaluating neutral presence versus specific risk categories:
  1. `neutral`
  2. `biased`
  3. `toxicity`
  4. `insult`
- **Inference Pipeline**: Leverages Hugging Face's `transformers.pipeline("zero-shot-classification")` with `multi_label=True`.

### 2. Caching & Weight Management
- **Local Cache**: Model weights are cached locally inside the container at:
  ```text
  ./backend/app/models/zero_shot
  ```
- **Singleton Loader Pattern**: To prevent loading model weights multiple times into memory (which crashes servers due to VRAM/RAM bloat), the model is loaded once at system startup using a `ModelManager` singleton pattern. It dynamically checks for cached weights on startup; if they are missing, it downloads them from the Hugging Face hub, caches them immediately, and performs all subsequent loads offline.

---

## 🎯 Risk Aggregation & Probability Realignment

1. **Probability Realignment**: Zero-shot pipelines inherently return labels sorted dynamically by confidence score. To maintain a strict JSON contract with the frontend UI, we map these dynamically ordered dictionaries into a stable, fixed index order:
   - Index 0: `neutral`
   - Index 1: `biased`
   - Index 2: `toxicity`
   - Index 3: `insult`
2. **Multi-Label Overall Score**: Because categories are evaluated independently (`multi_label=True`), the overall `overall_score` is computed as the maximum score of the three non-neutral categories (`biased`, `toxicity`, `insult`), rounded and clamped between `0` and `100`.

---

## 🔍 Explainability: LIME (Local Interpretable Model-agnostic Explanations)

LIME is used to break down the "black box" decisions of the BART model.

### 1. Dynamic Explainability Targeting
Unlike typical single-label explanations, our pipeline dynamically identifies which non-neutral category (biased, toxicity, or insult) received the **highest probability** score for the current input text. LIME is then dynamically instructed to explain that specific target label. This ensures that the generated heatmap highlights the exact words causing that specific risk flag.

### 2. LIME Operation Sequence:
1. **Perturbation**: LIME takes the input sentence and perturbs it by removing random tokens to generate a neighborhood of similar texts.
2. **Prediction**: The perturbed texts are passed through our local BART classifier to observe changes in prediction probabilities for the target class.
3. **Linear Regression Fit**: LIME fits a simple, highly interpretable weighted linear regression model to the predictions.
4. **Attention Score Extraction**: The weights of this linear regression model represent the "bias score" for each token.
5. **Sequential Heatmap Re-ordering**: LIME returns features ordered by weight. To prevent the frontend from rendering scrambled words, the backend maps these weights back to the original sentence tokens in their correct sequence order before sending the payload.

```text
[Original Text] ──► [Token Perturbations] ──► [BART Classification] ──► [Linear Fit] ──► [Sequential Mapping]
```

---

## ⚡ Concurrency & Performance Engineering

### 1. ThreadPoolExecutor CPU Offloading
LIME relies on running **thousands of model inferences** to score a single paragraph. This is highly CPU-bound and will block FastAPI's single-threaded event loop, freezing all active network requests.

To keep the FastAPI server fully responsive and concurrent, we offload all LIME perturbation computations to an asynchronous `ThreadPoolExecutor`:

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=2)

async def analyze_text(text: str):
    # Run the CPU-heavy inference inside a separate worker thread
    loop = asyncio.get_event_loop()
    explanation = await loop.run_in_executor(
        executor, 
        model_manager.explain, 
        text
    )
    return explanation
```

### 2. Model Weight Volume Mapping
By keeping model weights outside the static Docker image and mapping them dynamically inside the host volume:
- We keep the Docker image size extremely small (**multi-stage optimization**).
- We can persist the 1.6GB weights across container recreations without redownloading.
