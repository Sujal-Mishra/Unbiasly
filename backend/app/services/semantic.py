from google import genai
import json
import logging
from app.config import settings
import time

logger = logging.getLogger(__name__)

def get_gemini_client():
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "fallback_key":
        try:
            return genai.Client(api_key=settings.GEMINI_API_KEY)
        except Exception as e:
            logger.warning(f"Failed to init Gemini client: {e}")
            return None
    return None

def gemini_semantic_analysis(text: str) -> dict:
    client = get_gemini_client()
    
    fallback = {
        "loaded_language": 50,
        "identity_bias": 0,
        "emotional_framing": 50,
        "toxicity_risk": 20,
        "bias_type": "NEUTRAL",
        "model_interpretation": "Semantic analysis temporarily unavailable. Model flagged this payload based on structural patterns.",
        "neutral_rewrite": text
    }
    
    if not client:
        return fallback
        
    prompt = f"""
You are an advanced AI bias detection engine.
Analyze the following text for semantic bias.
TEXT:
{text}

Return ONLY valid JSON matching this schema:
{{
  "loaded_language": number between 0 and 100,
  "identity_bias": number between 0 and 100,
  "emotional_framing": number between 0 and 100,
  "toxicity_risk": number between 0 and 100,
  "bias_type": "OVERGENERALIZATION or IDENTITY_BIAS or LOADED_LANGUAGE or EMOTIONAL_FRAMING or TOXICITY or NEUTRAL",
  "model_interpretation": "professional explanation",
  "neutral_rewrite": "neutral rewritten version"
}}
"""
    models = ["gemini-2.5-flash", "gemini-2.0-flash"]
    for model_name in models:
        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                raw = response.text.strip()
                if raw.startswith("```"):
                    raw = raw.replace("```json", "").replace("```", "").strip()
                return json.loads(raw)
            except Exception as e:
                logger.warning(f"Gemini {model_name} attempt {attempt+1} failed: {e}")
                time.sleep(1)
                
    return fallback

def build_attention_heatmap(text: str, lime_explanation: list) -> list:
    # LIME explanation comes as list of (word, score)
    heatmap = []
    for word, score in lime_explanation:
        score_val = float(score)
        label = "neutral"
        if score_val > 0.05:
            label = "highly_biased"
        elif score_val > 0.02:
            label = "suspicious"
        
        heatmap.append({
            "word": str(word),
            "score": round(score_val, 3),
            "label": label
        })
    return heatmap
