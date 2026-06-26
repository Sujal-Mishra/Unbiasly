# 🐳 Unbiasly AI - Docker Infrastructure & API Resiliency

Unbiasly AI is deployed using a production-grade, highly resilient containerized multi-service orchestration. This architectural design ensures absolute isolation, security, speed, and decoupling from host environment discrepancies.

---

## 🏗️ Container Orchestration Architecture

The stack is composed of two primary containerized microservices managed via `docker-compose.yml`:

```
                           [ USER BROWSER ]
                                  │
                           (Port 80 HTTP)
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │     unbiasly-frontend   │
                     │      (Nginx Reverse)    │
                     └────────────┬────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
       [ Static Assets / ]               [ Proxied API /api/v1/ ]
         HTML, CSS, JS                            │
                                                  ▼
                                      ┌────────────────────────┐
                                      │    unbiasly-backend    │
                                      │   (FastAPI/Uvicorn)    │
                                      └────────────────────────┘
```

### 1. Frontend & Reverse Proxy: `unbiasly-frontend` (Nginx Alpine)
- **Role**: Serves the static client assets (`index.html`, `style.css`, `script.js`) and acts as a security reverse proxy.
- **Port**: Listens on Port `80` (public access).
- **CORS Mitigation**: By proxying `/api/v1/` requests directly to the backend container over Docker's internal bridge network, it completely eliminates all CORS (Cross-Origin Resource Sharing) configuration errors.

### 2. Deep Learning Inference API: `unbiasly-backend` (FastAPI Multi-Stage)
- **Role**: Hosts the FastAPI application, BART Zero-Shot inference model, and LIME perturbation worker threads.
- **Port**: Listens internally on Port `8000` (completely isolated from public exposure).

---

## 🛡️ Quadruple-Layered API Resiliency Model

To guarantee the application never crashes, degrades, or stalls due to network outages or API rate-limiting, the backend utilizes an unbreakable quadruple-layered waterfall pipeline for semantic analysis:

```text
  ┌────────────────────────────────────────────────────────┐
  │                 [POST /api/v1/analyze]                 │
  └───────────────────────────┬────────────────────────────┘
                              │
            ┌─────────────────▼─────────────────┐
            │ Layer 1: Gemini API (Primary Key) │
            └─────────────────┬─────────────────┘
                              │ (If Rate Limited)
            ┌─────────────────▼─────────────────┐
            │ Layer 2: Gemini API (Fallback Key)│
            └─────────────────┬─────────────────┘
                              │ (If Both Rate Limited)
            ┌─────────────────▼─────────────────┐
            │ Layer 3: Groq Cloud API (Llama)   │
            └─────────────────┬─────────────────┘
                              │ (If All Cloud Keys Fail)
            ┌─────────────────▼─────────────────┐
            │ Layer 4: Local Zero-Shot Fallback │
            └───────────────────────────────────┘
```

1. **Layer 1 (Gemini Primary Key)**: Performs high-reasoning contextual neutral rewrites.
2. **Layer 2 (Gemini Fallback Key)**: If the primary key is rate-limited (`429 RESOURCE_EXHAUSTED`), the backend automatically transparently retries the request using the secondary fallback key.
3. **Layer 3 (Groq Llama 3.1 Fallback)**: If both Gemini keys are blocked, the query is routed immediately to Groq LPU running `llama-3.1-8b-instant`. We pass a browser `User-Agent` header to prevent Cloudflare bot blocks, and enforce a strict `json_object` schema standard.
4. **Layer 4 (Local Zero-Shot Fallback)**: If all remote API calls fail or the server is completely offline, the system falls back to the local BART Zero-Shot classifier to dynamically calculate semantic vectors, and a local lexical rewriter that swaps out biased framing words for academic terms.

---

## 📦 Volume Mapping & Security

- **Trained Model Mount**: The directory `./backend/app/models/zero_shot` is bind-mounted directly into the container. This allows ML engineers to update weights or tweak tokenizer configurations without rebuilding or restarting the Docker environment.
- **Environment Ignored File**: `.env` is bind-mounted locally to keep API keys secure. It is strictly excluded from Git tracking via `.gitignore` to prevent credential exposure.
