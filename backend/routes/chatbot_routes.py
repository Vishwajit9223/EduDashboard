"""
Chatbot Routes — Gemini 2.0 Flash Integration
Full debug logging · strict v1beta payload · no hidden errors

REQUIREMENTS:
  - Generative Language API must be enabled in Google Cloud Console
  - Billing must be active on the GCP project that owns the key
  - API key must NOT be restricted to specific IPs/referrers during dev
  - Backend must be restarted after any .env change
"""

import os
import logging
import json as _json
import requests as http_client
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv

# ── Ensure .env is loaded even if app.py already did it ──────
load_dotenv()

# ── Logger ────────────────────────────────────────────────────
log = logging.getLogger("chatbot")
logging.basicConfig(
    level=logging.DEBUG,
    format="[%(asctime)s] %(levelname)s %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)

# ── Blueprint ─────────────────────────────────────────────────
chatbot_bp = Blueprint("chatbot", __name__, url_prefix="/api/chat")

# ── Gemini config ─────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL_URL = (
    "https://generativelanguage.googleapis.com"
    "/v1beta/models/gemini-2.0-flash:generateContent"
)
GEMINI_TIMEOUT = 25  # seconds

# ── Startup verification ─────────────────────────────────────
print(f"[CHATBOT] GEMINI_API_KEY loaded: {bool(GEMINI_API_KEY)}")
if GEMINI_API_KEY:
    print(f"[CHATBOT] Key preview: {GEMINI_API_KEY[:6]}******")
else:
    print("[CHATBOT] ⚠ WARNING — GEMINI_API_KEY is EMPTY. All chat calls will fail.")
print(f"[CHATBOT] Model URL: {GEMINI_MODEL_URL}")

SYSTEM_PROMPT = (
    "You are EduAssist AI — a knowledgeable, friendly, and encouraging assistant "
    "specializing in:\n"
    "1. Scholarship opportunities & eligibility (India + international)\n"
    "2. Competitive exam preparation (JEE, NEET, CAT, SSC, UPSC, etc.)\n"
    "3. Educational career counseling & path planning\n"
    "4. University admissions & application processes\n"
    "5. Study strategies & time management\n\n"
    
    "RESPONSE FORMAT GUIDELINES (IMPORTANT):\n"
    "Always structure your responses as follows:\n\n"
    
    "1. **TITLE** (bold, relevant emoji, 5-8 words)\n"
    "   Example: **📘 JEE Preparation Strategy**\n\n"
    
    "2. Brief Introduction (1-2 sentences max)\n"
    "   Make it relevant and engaging.\n\n"
    
    "3. Main Content - Use Numbered Sections:\n"
    "   **1. Key Concept / Overview**\n"
    "   - Use bullet points\n"
    "   - Keep points concise\n\n"
    "   **2. Step-by-Step Guidance**\n"
    "   - Clear, actionable steps\n"
    "   - Use numbered lists (1. 2. 3.)\n\n"
    "   **3. Tips & Best Practices**\n"
    "   - Practical advice\n"
    "   - Real-world insights\n\n"
    
    "4. **✅ Quick Summary** (optional, 1-2 lines)\n"
    "   Recap the key takeaway.\n\n"
    
    "5. **📚 Resources** (optional, 1-3 suggestions)\n"
    "   - Link or mention relevant resources\n\n"
    
    "FORMATTING RULES:\n"
    "- Use **bold** for section headings\n"
    "- Use bullet points (- ) for lists\n"
    "- Use numbered lists (1. 2. 3.) for steps\n"
    "- Add empty lines between sections\n"
    "- Keep paragraphs short (2-3 lines max)\n"
    "- Use emojis in titles for visual appeal\n"
    "- Avoid long blocks of text\n\n"
    
    "TONE & STYLE:\n"
    "- Professional yet friendly\n"
    "- Clear, confident, and encouraging\n"
    "- Similar to ChatGPT/Google Gemini responses\n"
    "- Be concise and actionable\n"
    "- Avoid jargon unless necessary\n"
    "- If unsure, say so and recommend official sources\n\n"
    
    "RESPONSE QUALITY:\n"
    "- Prioritize clarity and usefulness over length\n"
    "- Every response must be formatted following the structure above\n"
    "- Never return unformatted, paragraph-heavy text\n"
    "- Always include a title and introduction\n"
    "- Always use markdown formatting"
)


# ══════════════════════════════════════════════════════════════
#  Gemini API helper
# ══════════════════════════════════════════════════════════════

def _call_gemini(messages: list) -> str:
    """
    Send *messages* to Gemini 2.0 Flash and return the generated text.

    Returns the text string on success.
    Raises Exception with full details on any failure — caller decides HTTP code.
    """

    # ── 1. API key check ─────────────────────────────────────
    log.debug("[GEMINI] API key present: %s", bool(GEMINI_API_KEY))
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is empty — check .env and restart server.")

    # ── 2. Build Gemini contents array ───────────────────────
    contents = []
    for msg in messages:
        role = msg.get("role", "")
        text = msg.get("content", "")
        if role == "user":
            contents.append({"role": "user", "parts": [{"text": text}]})
        elif role == "assistant":
            contents.append({"role": "model", "parts": [{"text": text}]})

    if not contents:
        raise ValueError("No valid user/assistant messages to send.")

    log.debug("[GEMINI] Sending %d content blocks", len(contents))

    # ── 3. Strict v1beta payload (minimal, proven format) ────
    payload = {
        "contents": contents,
        "system_instruction": {
            "parts": [{"text": SYSTEM_PROMPT}]
        },
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 512,
        },
    }

    full_url = f"{GEMINI_MODEL_URL}?key={GEMINI_API_KEY}"
    log.debug("[GEMINI] POST %s?key=***", GEMINI_MODEL_URL)

    # ── 4. HTTP call ─────────────────────────────────────────
    try:
        resp = http_client.post(
            full_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=GEMINI_TIMEOUT,
        )
    except http_client.exceptions.Timeout:
        log.error("[GEMINI] ⏱ Request timed out after %ds", GEMINI_TIMEOUT)
        raise RuntimeError(f"Gemini timed out after {GEMINI_TIMEOUT}s.")
    except http_client.exceptions.RequestException as exc:
        log.error("[GEMINI] 🌐 Network error: %s", exc)
        raise RuntimeError(f"Network error: {exc}")

    # ── 5. Log FULL response (the core debug output) ─────────
    log.info("[GEMINI] Status: %d", resp.status_code)
    log.debug("[GEMINI] Response headers: %s", dict(resp.headers))
    log.info("[GEMINI] Response body (first 800 chars):\n%s", resp.text[:800])

    # ── 6. Non-200 → log everything, return details ──────────
    if resp.status_code != 200:
        log.error("[GEMINI] ❌ FULL ERROR BODY:\n%s", resp.text)
        raise RuntimeError(
            f"Gemini HTTP {resp.status_code}: {resp.text[:500]}"
        )

    # ── 7. Parse JSON ────────────────────────────────────────
    try:
        body = resp.json()
    except ValueError:
        log.error("[GEMINI] Response is not JSON: %s", resp.text[:500])
        raise RuntimeError("Gemini returned non-JSON response.")

    log.debug("[GEMINI] Parsed JSON keys: %s", list(body.keys()))

    # ── 8. Extract text from candidates ──────────────────────
    candidates = body.get("candidates")
    if not candidates or not isinstance(candidates, list):
        log.error("[GEMINI] No candidates in response: %s", _json.dumps(body)[:500])
        raise RuntimeError(f"Gemini returned no candidates: {_json.dumps(body)[:300]}")

    first = candidates[0]
    parts = first.get("content", {}).get("parts", [])
    if not parts or "text" not in parts[0]:
        log.error("[GEMINI] No text in candidate: %s", _json.dumps(first)[:500])
        raise RuntimeError(f"Gemini candidate has no text: {_json.dumps(first)[:300]}")

    text = parts[0]["text"]
    log.info("[GEMINI] ✅ Got %d chars: %.200s", len(text), text)
    return text


# ══════════════════════════════════════════════════════════════
#  Routes
# ══════════════════════════════════════════════════════════════

@chatbot_bp.route("/message", methods=["POST"])
def send_message():
    """
    POST /api/chat/message
    Returns 200 ONLY when Gemini actually generates a response.
    """

    # ── Parse JSON body ──────────────────────────────────────
    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        log.warning("[/message] Bad request — no JSON body")
        return jsonify({"success": False, "message": "Request body must be valid JSON."}), 400

    user_text = (data.get("message") or "").strip()
    if not user_text:
        log.warning("[/message] Bad request — empty message")
        return jsonify({"success": False, "message": "'message' field is required."}), 400

    history = data.get("conversation_history", [])
    if not isinstance(history, list):
        log.warning("[/message] Bad request — conversation_history is not a list")
        return jsonify({"success": False, "message": "'conversation_history' must be a list."}), 400

    # Build conversation
    conversation = []
    for entry in history:
        if isinstance(entry, dict) and "role" in entry and "content" in entry:
            conversation.append(entry)
    conversation.append({"role": "user", "content": user_text})

    log.info("[/message] user='%.80s'  history=%d", user_text, len(history))

    # ── Call Gemini ──────────────────────────────────────────
    try:
        ai_text = _call_gemini(conversation)
    except Exception as exc:
        log.error("[/message] Gemini failed: %s", exc)
        return jsonify({
            "success": False,
            "message": f"Gemini Error: {exc}",
            "details": str(exc),
        }), 500

    return jsonify({"success": True, "message": ai_text}), 200


@chatbot_bp.route("/health", methods=["GET"])
def chatbot_health():
    """GET /api/chat/health"""
    has_key = bool(GEMINI_API_KEY)
    log.info("[/health] api_key_present=%s", has_key)
    return jsonify({
        "success": has_key,
        "message": "Chatbot ready." if has_key else "GEMINI_API_KEY missing — check .env",
        "api_key_configured": has_key,
    }), 200 if has_key else 503


@chatbot_bp.route("/suggestions", methods=["GET"])
def get_suggestions():
    """GET /api/chat/suggestions"""
    suggestions = [
        {"id": 1, "title": "Scholarship Opportunities",
         "description": "Tell me about available scholarships",
         "message": "What scholarships are available for students in India?"},
        {"id": 2, "title": "Eligibility Check",
         "description": "Check my scholarship eligibility",
         "message": "How can I check if I am eligible for scholarships?"},
        {"id": 3, "title": "Exam Preparation",
         "description": "Get exam preparation guidance",
         "message": "How can I prepare for competitive exams like JEE and NEET?"},
        {"id": 4, "title": "Application Process",
         "description": "Learn about application process",
         "message": "What is the process to apply for scholarships?"},
        {"id": 5, "title": "Career Guidance",
         "description": "Get career counseling advice",
         "message": "Can you help me choose a suitable career path?"},
        {"id": 6, "title": "Financial Aid",
         "description": "Learn about financial support options",
         "message": "What financial aid options are available for students?"},
    ]
    return jsonify({"success": True, "suggestions": suggestions}), 200


@chatbot_bp.route("/context", methods=["POST"])
def set_context():
    """POST /api/chat/context"""
    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({"success": False, "message": "Request body must be valid JSON."}), 400

    context = {
        k: data[k]
        for k in ("user_id", "age", "category", "education_level", "stream")
        if k in data and data[k] is not None
    }
    log.info("[/context] keys=%s", list(context.keys()))
    return jsonify({"success": True, "message": "Context set.", "context": context}), 200


@chatbot_bp.route("/test-gemini", methods=["GET"])
def test_gemini():
    """
    GET /api/chat/test-gemini
    Calls Gemini directly with a trivial prompt — use to isolate backend issues.
    """
    log.info("[/test-gemini] Running direct Gemini test...")
    diag = {
        "key_loaded": bool(GEMINI_API_KEY),
        "key_preview": f"{GEMINI_API_KEY[:6]}******" if len(GEMINI_API_KEY) > 6 else "EMPTY",
        "model_url": GEMINI_MODEL_URL,
    }
    try:
        reply = _call_gemini([{"role": "user", "content": "Say hello in one sentence."}])
        diag["success"] = True
        diag["response"] = reply
    except Exception as exc:
        diag["success"] = False
        diag["error"] = str(exc)
    return jsonify(diag), 200 if diag["success"] else 500
