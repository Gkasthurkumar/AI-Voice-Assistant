import base64
import json
from flask import Flask, render_template, request
from worker import speech_to_text, text_to_speech, openai_process_message
from flask_cors import CORS
import os

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


@app.route('/speech-to-text', methods=['POST'])
def speech_to_text_route():
    audio=request.data
    text=speech_to_text(audio)
    return text


@app.route('/process-message', methods=['POST'])
def process_prompt_route():
    data = request.get_json()

    user_message = data["userMessage"]
    voice = data["voice"]

    openai_response = openai_process_message(user_message)

    speech = text_to_speech(openai_response, voice)

    speech_base64 = base64.b64encode(speech).decode("utf-8")

    response = app.response_class(
        response=json.dumps({
            "openaiResponseText": openai_response,
            "openaiResponseSpeech": speech_base64
        }),
        status=200,
        mimetype='application/json'
    )

    return response

if __name__ == "__main__":
    app.run(port=8000, host='0.0.0.0',debug=True)
