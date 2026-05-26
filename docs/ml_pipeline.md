# 🤖 Unbiasly AI - Machine Learning Pipeline & Explainability

Unbiasly AI leverages an advanced, highly specialized hybrid machine learning architecture. It combines **local GPU/CPU-bound deep classification** with **model-agnostic explainability (LIME)** and **high-reasoning generative heuristics (LLMs)**.

---

## 🧠 Model Specifications

### 1. Base Classifier: BERT (Bidirectional Encoder Representations from Transformers)
- **Model**: `bert-base-uncased` (110M Parameters).
- **Domain**: Binary sentiment/bias classification (Classes: `biased` vs. `neutral`).
- **Tuning Framework**: **PEFT (Parameter-Efficient Fine-Tuning)** with **LoRA (Low-Rank Adaptation)**.

### 2. LoRA Fine-Tuning Details
- **Target Modules**: `query`, `value` projection layers in the self-attention heads.
- **Rank ($r$)**: `8`.
- **Scaling Factor ($\alpha$)**: `16`.
- **Memory Optimization**: The tokenizer and adapter weights are cached locally inside the container at:
  ```text
  ./backend/app/models/bias_model
  ```
- **Singleton Loader Pattern**: To prevent loading model weights multiple times into memory (which crashes servers due to VRAM/RAM bloat), the model is loaded once at system startup using a `ModelManager` singleton pattern.

---

## 🔍 Explainability: LIME (Local Interpretable Model-agnostic Explanations)

LIME is used to break down the "black box" decisions of the BERT-LoRA model.

### LIME Operation Sequence:
1. **Perturbation**: LIME takes the input sentence and perturbs it by removing random tokens to generate a neighborhood of similar texts.
2. **Prediction**: The perturbed texts are passed through our local BERT classifier to observe changes in prediction probabilities.
3. **Linear Regression Fit**: LIME fits a simple, highly interpretable weighted linear regression model to the predictions.
4. **Attention Score Extraction**: The weights of this linear regression model represent the "bias score" for each token.
5. **Dynamic Heatmap Generation**: The scores are compiled into a normalized token matrix and sent to Nginx to render the interactive highlights on the frontend.

```text
[Original Text] ──► [Token Perturbations] ──► [BERT Classification] ──► [Linear Fit] ──► [Attention Weight]
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
- We can hot-swap or update LoRA adapter weights instantly on the host system without rebuilding or restarting the Docker environment!
