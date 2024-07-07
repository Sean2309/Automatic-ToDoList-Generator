import whisper
import requests
import json
import sys
import os
import wave

def generate_todo_from_audio(audio_path):
    print('generating to do')
    transcribedText = transcribe_audio(audio_path)
    todo = generate_todo(transcribedText)
    return todo

# https://pypi.org/project/openai-whisper/
def transcribe_audio(audio_path):
    model = whisper.load_model("base")

    # audio = whisper.load_audio("./aiaudio.wav")
    audio_path = os.path.join(os.getcwd(), 'temp-audio.wav')
    if (os.path.exists(audio_path)):
        print(f'audio path exists: {audio_path}')

    # Load the audio file using wave module
    # with wave.open(audio_path, 'rb') as wav_file:
    #     framerate = wav_file.getframerate()
    #     audio_data = wav_file.readframes(wav_file.getnframes())

    # Load audio data into whisper
    # audio = whisper.Audio(audio_data, sample_rate=framerate)
    audio_data = whisper.load_audio(audio_path)
    # with open(audio_path, 'rb') as f:
    #     audio_data = f.read()
    # audio_data = whisper.load_audio(audio_path)
    # Adding padding
    audio = whisper.pad_or_trim(audio_data)
    print('audio padded or trimmed')
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
    # print('Entering generate to do function', file=sys.err)
    print('Entering generate to do function')
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
