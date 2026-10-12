from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
import httpx
import logging
from api.auth import oauth2_scheme
from database.database import get_db
from sqlalchemy.orm import Session
from database.models import User
from services.auth_service import decode_token

router = APIRouter(prefix="/ai", tags=["AI"])
logger = logging.getLogger(__name__)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    history: Optional[List[ChatMessage]] = []
    context: Optional[Dict] = {}


class ChatResponse(BaseModel):
    response: str
    technical_level: str = "clinical"
    references: Optional[List[str]] = []


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    user = db.query(User).filter(User.username == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


SYSTEM_PROMPT_EN = """You are an expert clinical therapist specializing in Interferential Therapy (IFT). Provide TECHNICAL, EVIDENCE-BASED, PRECISE answers.

RULES:
1. ALWAYS give specific numbers (Hz, %, mA, minutes)
2. Reference clinical guidelines (APTA, Cochrane, WHO)
3. Structure with headings and tables
4. Include safety warnings
5. Never give vague answers

Knowledge:
- IFT uses two medium-freq currents (2–10 kHz) that cross, producing low-freq beat at tissue intersection
- Beat = |f1 - f2| in Hz
- Acute pain: 4 kHz carrier, 80-100 Hz beat, 25-35% intensity, 10 min
- Chronic pain: 8-10 kHz carrier, 2-10 Hz beat, 35-50% intensity, 20 min
- Lumbar disc: 4-6 kHz, 90-110 Hz beat, 30-40%, 15-20 min
- Cervical: 4 kHz, 80-100 Hz, 25-35%, 15 min
- Sciatica: 6-8 kHz, 80-100 Hz, 30-40%, 20 min
- Electrode placement: 8-12 cm apart, gel pads, avoid carotid/head/heart
- Contraindications: pacemaker, pregnancy, DVT, malignancy, infection
"""


def get_fallback(message: str, lang: str = "en") -> str:
    lower = message.lower()

    if any(k in lower for k in ["frequency", "hz", "khz", "ಆವರ್ತನ"]):
        return """**FREQUENCY SELECTION — IFT PROTOCOL**

**Carrier frequency (2–10 kHz):**
• 4 kHz    → Acute pain, superficial
• 6–8 kHz  → Subacute, moderate depth
• 8–10 kHz → Chronic, deep tissue

**Beat frequency (1–250 Hz):**
• 1–10 Hz   → Endorphin release (chronic)
• 10–25 Hz  → Muscle pump (edema, spasm)
• 50–100 Hz → Pain gating (gate control)
• 100–150 Hz→ Acute pain / post-op
• 150–250 Hz→ Trigger point

**Starting point:** 4 kHz carrier, 100 Hz beat, 30% intensity, 15 min."""

    if any(k in lower for k in ["intensity", "%", "ತೀವ್ರತೆ"]):
        return """**INTENSITY CALIBRATION**

• Sensory (15–25%)   → Mild tingling
• Motor (30–45%)     → Visible contraction
• Noxious (>60%)     → AVOID
• Hardware limit     → 50 mA
• Software cutoff    → 8.5 mA

**Titration:** Start at 0%, increase 5% every 30s."""

    if any(k in lower for k in ["lumbar", "disc", "herniation"]):
        return """**LUMBAR DISC HERNIATION — IFT PROTOCOL**

• Carrier: 4,000–6,000 Hz
• Beat: 90–110 Hz
• Intensity: 30–40%
• Duration: 15–20 min
• Placement: Bipolar crossed (L2-L4 / L4-S1)
• Frequency: 3–5×/week for 2–3 weeks

**Safety:** Avoid if pacemaker, DVT, pregnancy."""

    if any(k in lower for k in ["safety", "contraindic", "ಸುರಕ್ಷತೆ"]):
        return """**IFT CONTRAINDICATIONS**

**Absolute:**
1. Cardiac pacemaker / ICD
2. Pregnancy (abdomen/lumbar)
3. Active DVT / thrombophlebitis
4. Over carotid sinus / head
5. Malignancy in area
6. Osteomyelitis / infection
7. Hemorrhagic conditions

**Relative:** Impaired sensation, cognitive impairment, metal implants."""

    return """**IFT CLINICAL ASSISTANT**

Ask about:
• Frequency selection (carrier + beat)
• Intensity calibration
• Electrode placement
• Clinical protocols (lumbar, cervical, OA)
• Safety and contraindications
• Session design

Please ask a specific question for a technical answer."""


async def query_groq(messages: list) -> str:
    GROQ_API_KEY = "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"
    async with httpx.AsyncClient(timeout=45.0) as client:
        try:
            r = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": messages,
                    "temperature": 0.4,
                    "max_tokens": 800,
                },
            )
            if r.status_code != 200:
                raise Exception(f"Groq {r.status_code}")
            data = r.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.warning(f"Groq failed: {e}")
            raise


async def get_ai_response(message: str, language: str, history: list) -> str:
    system = SYSTEM_PROMPT_EN
    messages = [{"role": "system", "content": system}]

    for h in (history or [])[-6:]:
        role = h.role if hasattr(h, 'role') else h.get('role', 'user')
        content = h.content if hasattr(h, 'content') else h.get('content', '')
        messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": message})

    try:
        return await query_groq(messages)
    except Exception:
        return get_fallback(message, language)


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, current_user: User = Depends(get_current_user)):
    try:
        response = await get_ai_response(request.message, request.language, request.history)
        return ChatResponse(response=response, references=[
            "Watson T. Electrotherapy: Evidence-Based Practice (2014)",
            "APTA Clinical Practice Guidelines (2020)",
        ])
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return ChatResponse(response="Technical difficulties. Please try again.")