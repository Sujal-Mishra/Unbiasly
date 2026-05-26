# 🔌 Unbiasly AI - REST API Specifications

The FastAPI backend exposes a production-ready, schema-strict REST API contract. All data structures are validated at runtime using **Pydantic v2 DTOs** (Data Transfer Objects).

---

## 📡 Analysis Endpoint: `POST /api/v1/analyze`

Triggers the hybrid BERT-LoRA, LIME explainability, and semantic LLM synthesis pipeline.

### Request Body Schema (Pydantic: `AnalyzeRequest`)
```json
{
  "text": "string (Required, minimum length 1 character)"
}
```

### Response Body Schema (Pydantic: `AnalyzeResponse`)
```json
{
  "overall_score": 84,
  "risk_level": "HIGH",
  "bias_type": "OVERGENERALIZATION",
  "model_interpretation": "Detailed professional explanation of the text classification.",
  "neutral_rewrite": "Objective rewrite of the text.",
  "semantic_vectors": {
    "loaded_language": 88,
    "identity_bias": 72,
    "emotional_framing": 84,
    "toxicity_risk": 92
  },
  "sentence_vector": {
    "sentence": "These people are always causing problems because their ideology is dangerous.",
    "bias_type": "IDENTITY_BIAS"
  },
  "attention_heatmap": [
    {
      "word": "these",
      "score": 0.082,
      "label": "highly_biased"
    },
    {
      "word": "people",
      "score": 0.054,
      "label": "highly_biased"
    },
    {
      "word": "always",
      "score": 0.031,
      "label": "suspicious"
    }
  ]
}
```

---

## 📐 Dynamic Frontend Schema Adapter

The frontend user interface originally executed a camelCase contract, whereas the backend FastAPI schema follows Python standard snake_case naming conventions.

To bridge this seamlessly without refactoring any visual layout code, a **Schema Adapter** is implemented inside the client-side API handler (`script.js`).

### Mapped JSON Schema Conversion:
```javascript
const mappedData = {
    overallBias: data.overall_score,
    confidence: 95, 
    risk: `${data.risk_level} RISK`,
    riskColor: riskColor,
    timestamp: new Date().toLocaleString(),
    categories: {
        loadedLanguage: data.semantic_vectors.loaded_language,
        identityBias: data.semantic_vectors.identity_bias,
        emotionalFraming: data.semantic_vectors.emotional_framing,
        toxicityRisk: data.semantic_vectors.toxicity_risk
    },
    heatmap: heatmapHTML,
    sentenceAnalysis: sentenceAnalysis,
    neutralRewrite: data.neutral_rewrite,
    explainability: data.model_interpretation
};
```
This ensures zero visual breaks on the dashboard while maintaining clean, PEP-8 compliant data payloads on the backend service!
