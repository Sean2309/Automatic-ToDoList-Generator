from flask import Flask, render_template, request, jsonify
import base64
import os
import subprocess
from modules import generate_todo_from_audio

app = Flask(__name__)

def add_padding(base64_str):
    return base64_str + '=' * (-len(base64_str) % 4)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        # Get audio data from request
        audioData = request.json.get('audioData')
        print(f"Audio Data: {audioData[0:100]}")
        # Strip data URL prefix if present
        if audioData.startswith('data:audio/wav;base64,'):
            audioData = audioData.replace('data:audio/wav;base64,', '')

        # Add Padding 
        base64_audio = add_padding(audioData)

        # Decode base64 Audio Data
        audioBytes = base64.b64decode(base64_audio)

        # Save audio data to temp file
        audioPath = 'temp-audio.wav'
        with open(audioPath, 'wb') as audioFile:
            audioFile.write(audioBytes)

        # Debug: Check if the file exists
        if os.path.exists(audioPath):
            print(f"File {audioPath} created successfully.")
            print(f"File size: {os.path.getsize(audioPath)} bytes")
        else:
            print(f"File {audioPath} was not created.")

        # Debug: Print the current working directory
        print(f"Current working directory: {os.getcwd()}")

        # Run transcription script TODO: Modify the python path if needed, and conda env
        # result = subprocess.run(
        #     ['conda', 'run', '--name', 'tiktokEnv','python', './speechtotext/openaistt.py'],
        #     capture_output=True,
        #     text=True
        # )
        # Perform transcription using the modules.py function
        transcription = generate_todo_from_audio(audioPath)
        os.remove(audioPath)
        return jsonify({'success': True, 'transcription': transcription})
        # print(f"Audio Path: {audioPath}")
        # result = None
        # result = generate_todo_from_audio(audioPath)
        # print(result)
        # # Remove temp file
        # os.remove(audioPath)

        # if "Error:" not in result:
        #     return jsonify({'success': True, 'transcription': result})
        # else:
        #     return jsonify({'success': False, 'error': result.stderr.strip()})
    except Exception as e:
        print('finewfp')
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
