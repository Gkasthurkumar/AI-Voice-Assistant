import os
import json
import base64

from flask import Flask, render_template, request
from flask_cors import CORS

from worker import (
    text_to_speech,
    chat_with_llama
)

app = Flask(__name__)
CORS(app)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/process-message", methods=["POST"])
def process_prompt_route():

    data = request.get_json()

    if not data or "userMessage" not in data:
        return {"error": "userMessage missing"}, 400

    user_message = data["userMessage"]

    reply = chat_with_llama(user_message)

    audio_path = text_to_speech(reply)

    with open(audio_path, "rb") as audio_file:
        speech_base64 = base64.b64encode(
            audio_file.read()
        ).decode("utf-8")

    return {
        "openaiResponseText": reply,
        "openaiResponseSpeech": speech_base64
    }


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8000,
        debug=True
    )
