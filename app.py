from flask import Flask, render_template, jsonify
from speechtotext.whisper import transcribe_audio_file

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    try:
        # Path to the audio file you want to transcribe
        audio_path = r"C:\Users\ozhen\SUTD\techjam\Automatic-ToDoList-Generator\speechtotext\aiaudio.mp3"
        
        # Use the transcribe function from whisper_service
        transcription_result = transcribe_audio_file(audio_path)
        
        return jsonify(transcription_result)
    
    except Exception as e:
        return jsonify({"message": "An error occurred", "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
