from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import httpx
import logging
import os
from api.auth import oauth2_scheme
from database.database import get_db
from sqlalchemy.orm import Session
from database.models import User
from services.auth_service import decode_token

router = APIRouter(prefix="/ai", tags=["AI"])
logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    message: str
    language: str = "en"

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ─── Groq API ────────────────────────────────────────────────────
GROQ_API_KEY = "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"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"  # Try also: "llama3-70b-8192" or "mixtral-8x7b-32768"

# ─── Hugging Face Fallback (no API key required) ──────────────
HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3"

async def query_groq(prompt: str) -> str:
    """Query Groq API with proper error handling."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            logger.info(f"🔄 Querying Groq API with model: {GROQ_MODEL}")
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": "You are a helpful medical therapy assistant. Answer only medical and therapy-related questions."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 500,
                }
            )
            
            logger.info(f"📡 Groq response status: {response.status_code}")
            
            if response.status_code == 401:
                logger.error("❌ Invalid Groq API key")
                raise Exception("Invalid API key")
            elif response.status_code == 429:
                logger.error("❌ Rate limit exceeded")
                raise Exception("Rate limit exceeded")
            elif response.status_code != 200:
                error_detail = response.text
                logger.error(f"❌ Groq API error: {response.status_code} - {error_detail}")
                raise Exception(f"Groq API returned {response.status_code}")
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
            
        except httpx.TimeoutException:
            logger.error("❌ Groq API timeout")
            raise Exception("Request timeout")
        except Exception as e:
            logger.error(f"❌ Groq request failed: {e}")
            raise

async def query_huggingface(prompt: str) -> str:
    """Fallback to Hugging Face free inference API."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            logger.info("🔄 Falling back to Hugging Face API")
            response = await client.post(
                HF_API_URL,
                json={
                    "inputs": prompt,
                    "parameters": {
                        "max_new_tokens": 300,
                        "temperature": 0.7,
                        "do_sample": True,
                    }
                }
            )
            
            if response.status_code != 200:
                logger.error(f"❌ Hugging Face error: {response.status_code}")
                raise Exception(f"HF API returned {response.status_code}")
            
            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                generated = result[0].get("generated_text", "")
                # Remove the prompt from the response
                if generated.startswith(prompt):
                    return generated[len(prompt):].strip()
                return generated.strip()
            return "I couldn't generate a response."
            
        except Exception as e:
            logger.error(f"❌ Hugging Face failed: {e}")
            raise

async def get_ai_response(user_message: str, language: str = "en") -> str:
    system_prompt = (
        "You are a knowledgeable assistant for an Interferential Therapy (IFT) system. "
        "Answer only questions related to pain management, physical therapy, IFT, electrical stimulation, "
        "musculoskeletal conditions, and rehabilitation. If the question is off-topic, politely say you can only answer "
        "medical and therapy-related questions. Keep responses concise, helpful, and evidence-based."
    )
    full_prompt = f"{system_prompt}\n\nUser: {user_message}\nAssistant:"

    # ─── Try Groq first ──────────────────────────────────────────
    try:
        response = await query_groq(full_prompt)
        logger.info("✅ Response from Groq")
        return response
    except Exception as groq_error:
        logger.warning(f"Groq failed: {groq_error}")
        
        # ─── Try Hugging Face fallback ──────────────────────────
        try:
            response = await query_huggingface(full_prompt)
            logger.info("✅ Response from Hugging Face")
            return response
        except Exception as hf_error:
            logger.error(f"Hugging Face also failed: {hf_error}")
            
            # ─── Final fallback: intelligent mock responses ──────
            lower_msg = user_message.lower()
            
            # Check for specific keywords
            if any(word in lower_msg for word in ['frequency', 'hz', 'khz']):
                return "For IFT therapy, frequencies typically range from 4 kHz to 10 kHz. The optimal frequency depends on the condition being treated. Lower frequencies (4-6 kHz) are often used for acute pain, while higher frequencies (8-10 kHz) may be better for chronic conditions."
            
            elif any(word in lower_msg for word in ['intensity', '%']):
                return "Therapy intensity is usually set between 30% and 80% of the patient's tolerance. We recommend starting at a low intensity (30-40%) and gradually increasing based on patient comfort and response."
            
            elif any(word in lower_msg for word in ['pain', 'relief', 'ache']):
                return "IFT therapy helps reduce pain through several mechanisms: blocking pain signals, stimulating endorphin release, and promoting blood flow. Many patients experience significant pain relief after 10-15 minutes of treatment."
            
            elif any(word in lower_msg for word in ['session', 'duration', 'time']):
                return "Typical IFT sessions last between 10 to 30 minutes. The duration depends on the condition and patient response. Always monitor patient comfort throughout the session."
            
            elif any(word in lower_msg for word in ['electrode', 'placement', 'pad']):
                return "Electrodes should be placed around the treatment area, with the pain site between the electrode pairs. Ensure good skin contact and use gel pads for optimal conductivity."
            
            elif any(word in lower_msg for word in ['kannada', 'ಕನ್ನಡ']):
                return "ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಇಂಗ್ಲಿಷ್ನಲ್ಲಿ ಕೇಳಿ ಅಥವಾ ನಾನು ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಲು ಪ್ರಯತ್ನಿಸುತ್ತೇನೆ. (I understand you asked in Kannada. Please ask in English or I'll try my best to respond in Kannada.)"
            
            else:
                return "I'm here to help with IFT therapy questions. Please ask about frequency, intensity, pain management, session duration, or electrode placement. If you have a specific medical condition, I can provide general information to discuss with your healthcare provider."

@router.post("/chat")
async def chat(request: ChatRequest, current_user: User = Depends(get_current_user)):
    try:
        response = await get_ai_response(request.message, request.language)
        return {"response": response}
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        return {"response": "I'm experiencing technical difficulties. Please try again in a moment."}