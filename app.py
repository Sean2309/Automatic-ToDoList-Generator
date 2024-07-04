from flask import Flask, render_template, request, jsonify
import base64
import os
import subprocess
from modules import generate_todo_from_audio

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        # Get audio data from request
        audioData = request.json.get('audioData')

        # Decode base64 Audio Data
        audioBytes = base64.b64decode(audioData)

        # Save audio data to temp file
        audioPath = 'temp-audio.wav'
        with open(audioPath, 'wb') as audioFile:
            audioFile.write(audioBytes)

        # Run transcription script TODO: Modify the python path if needed, and conda env
        # result = subprocess.run(
        #     ['conda', 'run', '--name', 'tiktokEnv','python', './speechtotext/openaistt.py'],
        #     capture_output=True,
        #     text=True
        # )
        result = None
        result = generate_todo_from_audio(audioPath)
        print(result)
        # Remove temp file
        os.remove(audioPath)

        if "Error:" not in result:
            return jsonify({'success': True, 'transcription': result})
        else:
            return jsonify({'success': False, 'error': result.stderr.strip()})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
