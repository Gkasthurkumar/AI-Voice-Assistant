import os
import ollama
import whisper
from gtts import gTTS

# Load Whisper model only once
model = whisper.load_model("base")


def speech_to_text(audio_path):
    result = model.transcribe(audio_path)
    return result["text"]


def text_to_speech(text):
    os.makedirs("audio", exist_ok=True)

    filename = "audio/output.mp3"

    tts = gTTS(text=text, lang="en")
    tts.save(filename)

    return filename


def chat_with_llama(user_message):
    try:
        response = ollama.chat(
            model="llama3:latest",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful AI assistant."
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ]
        )

        return response["message"]["content"]

    except Exception as e:
        return f"Error: {str(e)}"