import os
import ollama
from gtts import gTTS


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
