import whisper

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