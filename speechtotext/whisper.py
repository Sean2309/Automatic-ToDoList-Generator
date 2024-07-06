import whisper

# Load the Whisper model once at the start
model = whisper.load_model("base")

def transcribe_audio_file(audio_path):
    # Load and process the audio file
    audio = whisper.load_audio(audio_path)
    audio = whisper.pad_or_trim(audio)
    
    # Create log-mel spectrogram
    mel = whisper.log_mel_spectrogram(audio).to(model.device)
    
    # Detect language
    _, probs = model.detect_language(mel)
    detected_language = max(probs, key=probs.get)
    
    # Decode audio to text
    options = whisper.DecodingOptions(fp16=False)
    result = whisper.decode(model, mel, options)
    
    # Prepare the result
    response = {
        "detected_language": detected_language,
        "transcription": result.text
    }
    
    return response
