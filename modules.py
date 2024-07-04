import whisper
import requests
import json

def generate_todo_from_audio(audio_path):
    transcribedText = transcribe_audio(audio_path)
    todo = generate_todo(transcribedText)
    return todo

# https://pypi.org/project/openai-whisper/
def transcribe_audio(audio_path):
    model = whisper.load_model("base")
    # load audio and trim it to fit 30 seconds
    audio = whisper.load_audio("speechtotext/aiaudio.mp3")
    audio = whisper.pad_or_trim(audio)
    # make log-mel spectrogram
    mel = whisper.log_mel_spectrogram(audio).to(model.device)
    # detect language
    # _, probs = model.detect_language(mel)
    # print(f"Detected language: {max(probs, key=probs.get)}")
    #decode audio
    options = whisper.DecodingOptions(fp16=False)
    result = whisper.decode(model,mel,options)
    #return transciption
    return result.text

# Download llama from https://ollama.com/download
# Download llama3 model after opening the application
def generate_todo(transcribedText):
    url = "http://localhost:11434/api/generate"
    headers = {
    "Content-Type": "application/json",
    }
    data = {
    "model": "llama3",
    "prompt": transcribedText,
    "stream": False,
    }

    response = requests.post(url, headers=headers, data=json.dumps(data))
    if response.status_code ==200:
        response_text = response.text
        data = json.loads(response_text)
        actual_response = data["response"]
        return actual_response
    else:
        return f"Error: {response.status_code}, {response.text}"
