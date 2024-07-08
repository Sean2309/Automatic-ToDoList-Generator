import whisper
import requests
import json
import regex
import os
import datetime
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]

def generate_todo_from_audio(audio_path):
    print('generating to do')
    transcribedText = transcribe_audio(audio_path)
    todo = generate_todo_code(transcribedText)
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
def generate_todo_code(transcribedText):
    # print('Entering generate to do function', file=sys.err)
    print('Entering generate to do function')
    url = "http://localhost:11434/api/generate"
    headers = {
    "Content-Type": "application/json",
    }
    data = {
    "model": "llama3",
    "prompt": "If it makes sense to make a todolist out of the following:'" + transcribedText + "' generate a google calendar python api code, just the event json portion. If not, just say 'NIL' and do not elaborate. Just for your information, the current date and time is:" + str(datetime.datetime.now()),
    "stream": False,
    }

    response = requests.post(url, headers=headers, data=json.dumps(data))
    if response.status_code ==200:
        response_text = response.text
        data = json.loads(response_text)
        actual_response = data["response"]
        # Regular expression to extract JSON part
        json_pattern = regex.compile(r'\{(?:[^{}]|(?R))*\}')
        json_match = json_pattern.findall(actual_response)

        if json_match:
            print(json_match)
            # generate_google_cal(json_match)
            return json_match
        else:
            print("No JSON found in the text")
            return None
    else:
        return f"Error: {response.status_code}, {response.text}"

def generate_google_cal(response):
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "credentials.json", SCOPES
            )
            creds = flow.run_local_server(port=0)
            # Save the credentials for the next run
            with open("token.json", "w") as token:
                token.write(creds.to_json())

    try:
        service = build("calendar", "v3", credentials=creds)
        for json_str in response:
            event_data = json.loads(json_str)
            event = service.events().insert(calendarId="primary", body=event_data).execute()
            print('Event created: %s' % (event.get('htmlLink')))
    except HttpError as error:
        return f"Error: {error}"
    except json.JSONDecodeError as e:
        return f"Failed to decode JSON: {e}"
