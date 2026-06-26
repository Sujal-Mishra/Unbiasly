# 🛡️ Unbiasly AI - Production Bias Detection & Mitigation Pipeline

Unbiasly AI is a startup-grade, highly engaging bias detection and explainability dashboard. It connects a high-performance local deep learning zero-shot classification model with multiple API fallback routers to deliver continuous, real-time objective text rephrasing and sub-word interpretability visualization.

```
     BART Zero-Shot Model     LIME Explainability      Quadruple Resilience LLM
     [ Local Classifier ] ──► [ Attention Heatmap ] ──► [   Contextual Rephrase  ]
```

---

## ⚡ Key Features
- **BART Zero-Shot Base Classifier**: Ultra-fast multi-label classification leveraging a locally cached `facebook/bart-large-mnli` model.
- **Interactive LIME Heatmap**: Custom micro-animated highlights mapping interpretability attention weights to exact text tokens in sequence.
- **Quadruple Fallback Resiliency**: Robust backend waterfall architecture that cycles through primary/fallback Gemini keys, Groq APIs, and local zero-shot/lexical rewriters to guarantee 100% server uptime.
- **Glassmorphic Matte Dark Dashboard**: A premium, state-of-the-art laboratory UI theme built using Vanilla HTML/CSS/JS.

---

## 🚀 Quick Start (Running in under 5 minutes)

Launch the full stack locally via Docker Compose:

```bash
# 1. Start the stack (automatically pulls base Nginx & builds FastAPI container)
docker compose up -d --build

# 2. Add your credentials (Gemini, Groq fallback) in the secure backend environment
# Open backend/.env and append your keys:
GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_KEY_FALLBACK=your_fallback_gemini_key
GROQ_API_KEY=gsk_your_groq_key

# 3. Restart the backend container to reload credentials
docker compose restart backend
```

Now, go to **`http://localhost`** in your browser! Your premium bias laboratory is live.

---

## 📚 Detailed Modular Documentation

To understand the core domains, architectures, and systems running Unbiasly AI, explore our modular documentation pages:

### 🎯 [Business Use Cases](./docs/usecases.md)
Discover the business value propositions across Journalism, Legal Compliance, Academic Research, and Enterprise Communications, including target personas and real-world execution maps.

### 🧠 [Machine Learning Pipeline](./docs/ml_pipeline.md)
Deep dive into our BART zero-shot classification architecture, dynamic target selection, LIME explainability fitting, sequential token mapping, and asynchronous CPU threadpool scheduling.

### 🎨 [Premium Design System](./docs/design_system.md)
Explore our high-contrast HSL color tokens, single-page dashboard grid blueprints, and dynamic SVG progress animations.

### 🐳 [Docker & API Resiliency Infrastructure](./docs/infrastructure.md)
Analyze the containerized reverse proxy topology, CORS elimination layers, and the unbreakable quadruple fallback sequence flow.

### 🔌 [REST API Specifications](./docs/api.md)
View the strict Pydantic v2 data models, request/response JSON schemas, and client-side camelCase data adapters.

