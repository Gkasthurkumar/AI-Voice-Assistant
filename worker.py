from openai import OpenAI
import requests

openai_client = OpenAI()


def speech_to_text(audio_binary):
    base_url="https://sn-watson-stt.labs.skills.network"
    api_url = base_url + "/speech-to-text/api/v1/recognize"

    params={
        "model":"en-US_Multimedia"
    }
    headers={
        "Content-Type":"audio/wav"   
         }
    response=requests.post(
        api_url,
        params=params,
        headers=headers,
        data=audio_binary
    ).json()
    text=""

    if response.get("results"):
        text=response["results"][0]["alterantives"][0]["transcript"]
    
    return text


def text_to_speech(text, voice="en-US_MichaelV3Voice"):
   base_url = "https://sn-watson-tts.labs.skills.network"
    api_url = base_url + "/text-to-speech/api/v1/synthesize"

    headers = {
        "Accept": "audio/wav",
        "Content-Type": "application/json"
    }

    params = {}

    if voice and voice != "default":
        params["voice"] = voice

    body = {
        "text": text
    }

    response = requests.post(
        api_url,
        headers=headers,
        params=params,
        json=body
    )

    print("Status:", response.status_code)
    print("Content-Type:", response.headers.get("Content-Type"))

    if response.status_code != 200:
        print(response.text)

    return response.content


def openai_process_message(user_message):
    response = openai_client.chat.completions.create(
        model="gpt-5-nano",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful voice assistant."
            },
            {
                "role": "user",
                "content": user_message
            }
        ]
    )

    return response.choices[0].message.content
