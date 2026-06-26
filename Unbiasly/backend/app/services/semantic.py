from google import genai
import json
import logging
from app.config import settings
import time

logger = logging.getLogger(__name__)

def get_gemini_clients() -> list:
    clients = []
    # Primary Key
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "fallback_key":
        try:
            clients.append(genai.Client(api_key=settings.GEMINI_API_KEY))
        except Exception as e:
            logger.warning(f"Failed to init primary Gemini client: {e}")
            
    # Fallback Key
    if settings.GEMINI_API_KEY_FALLBACK and settings.GEMINI_API_KEY_FALLBACK != "fallback_key":
        try:
            clients.append(genai.Client(api_key=settings.GEMINI_API_KEY_FALLBACK))
        except Exception as e:
            logger.warning(f"Failed to init fallback Gemini client: {e}")
            
    return clients

def heuristic_neutral_rewrite(text: str) -> str:
    rewritten = text
    # Dictionary mapping highly subjective/biased terms to academic and objective phrasings
    replacements = {
        "these people": "some individuals",
        "These people": "Some individuals",
        "always": "frequently",
        "Always": "Frequently",
        "never": "rarely",
        "Never": "Rarely",
        "dangerous": "assertive",
        "Dangerous": "Assertive",
        "manipulates": "influences",
        "Manipulates": "Influences",
        "ruining": "impacting",
        "Ruining": "Impacting",
        "ideology": "perspective",
        "Ideology": "Perspective",
        "causing problems": "raising discussions",
        "causing trouble": "raising concerns",
        "is dangerous": "presents a controversial perspective"
    }
    for search, replace in replacements.items():
        rewritten = rewritten.replace(search, replace)
    
    # Suffix hedge fallback if no explicit vocabulary matched
    if rewritten == text:
        rewritten = f"From an objective viewpoint, it can be stated that: {text}"
    return rewritten

import urllib.request
import urllib.error

def try_groq_semantic_analysis(text: str) -> dict:
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "fallback_key":
        logger.info("Groq API key not set or is fallback_key.")
        return None
        
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
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
    data = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "response_format": {"type": "json_object"}
    }
    
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            res = json.loads(response.read().decode("utf-8"))
            raw = res["choices"][0]["message"]["content"].strip()
            parsed = json.loads(raw)
            logger.info("Successfully fetched semantic analysis from Groq Llama 3.1!")
            return parsed
    except Exception as e:
        logger.warning(f"Groq API call failed: {e}")
        return None

def gemini_semantic_analysis(text: str) -> dict:
    clients = get_gemini_clients()
    
    fallback = {
        "loaded_language": 50,
        "identity_bias": 30,
        "emotional_framing": 50,
        "toxicity_risk": 20,
        "bias_type": "NEUTRAL",
        "model_interpretation": "Semantic analysis temporarily degraded due to API rate-limiting. A local lexical rewriter was used to construct the neutral alternative.",
        "neutral_rewrite": heuristic_neutral_rewrite(text)
    }
    
    try:
        from app.services.inference import model_manager
        if model_manager.is_loaded:
            custom_labels = ["loaded language", "identity bias", "emotional framing", "toxicity risk"]
            result = model_manager.classifier(
                text,
                candidate_labels=custom_labels,
                multi_label=True
            )
            label_to_score = dict(zip(result["labels"], result["scores"]))
            
            loaded_lang_score = round(label_to_score["loaded language"] * 100)
            identity_bias_score = round(label_to_score["identity bias"] * 100)
            emotional_framing_score = round(label_to_score["emotional framing"] * 100)
            toxicity_risk_score = round(label_to_score["toxicity risk"] * 100)
            
            scores_map = {
                "LOADED_LANGUAGE": loaded_lang_score,
                "IDENTITY_BIAS": identity_bias_score,
                "EMOTIONAL_FRAMING": emotional_framing_score,
                "TOXICITY": toxicity_risk_score
            }
            highest_type = max(scores_map, key=scores_map.get)
            
            if max(scores_map.values()) < 30:
                highest_type = "NEUTRAL"
                
            fallback["loaded_language"] = loaded_lang_score
            fallback["identity_bias"] = identity_bias_score
            fallback["emotional_framing"] = emotional_framing_score
            fallback["toxicity_risk"] = toxicity_risk_score
            fallback["bias_type"] = highest_type
            fallback["model_interpretation"] = (
                f"Local zero-shot classifier detected primary risk of {highest_type.replace('_', ' ').title()}. "
                f"A local lexical rewriter was used to construct the neutral alternative."
            )
    except Exception as e:
        logger.warning(f"Failed to generate dynamic local semantic fallback: {e}")
    
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
    
    for idx, client in enumerate(clients):
        client_name = "primary" if idx == 0 else "fallback"
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
                    logger.warning(f"Gemini {client_name} client with {model_name} attempt {attempt+1} failed: {e}")
                    time.sleep(1)
                    
    # All Gemini options failed -> Attempt Groq Fallback
    logger.info("All Gemini API keys rate-limited or unavailable. Attempting secondary fallback via Groq LPU...")
    groq_res = try_groq_semantic_analysis(text)
    if groq_res:
        return groq_res
        
    # All fail -> local fallback
    logger.warning("All Gemini and Groq semantic pipelines exhausted. Deploying local lexical fallback.")
    return fallback

def build_attention_heatmap(text: str, lime_explanation: list) -> list:
    import string
    # Map LIME explanations: lowercase words to their score
    word_scores = {str(word).lower(): float(score) for word, score in lime_explanation}
    
    # Helper to strip punctuation for clean lookup matching LIME tokenizer
    def clean_word(w):
        return w.strip(string.punctuation).lower()
        
    heatmap = []
    # Split the original text into tokens in sequence
    for word in text.split():
        cleaned = clean_word(word)
        score_val = word_scores.get(cleaned, 0.0)
        
        label = "neutral"
        if score_val > 0.05:
            label = "highly_biased"
        elif score_val > 0.02:
            label = "suspicious"
            
        heatmap.append({
            "word": word,
            "score": round(score_val, 3),
            "label": label
        })
    return heatmap
