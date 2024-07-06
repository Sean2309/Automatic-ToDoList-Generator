import whisper

model = whisper.load_model("base")
# load audio and trim it to fit 30 seconds
audio_path = r"C:\Users\ozhen\SUTD\techjam\Automatic-ToDoList-Generator\speechtotext\aiaudio.mp3"

# Load audio and trim it to fit 30 seconds
audio = whisper.load_audio(audio_path)
audio = whisper.pad_or_trim(audio)
# make log-mel spectrogram
mel = whisper.log_mel_spectrogram(audio).to(model.device)
# detect language
_, probs = model.detect_language(mel)
print(f"Detected language: {max(probs, key=probs.get)}")
#decode audio
options = whisper.DecodingOptions(fp16=False)
result = whisper.decode(model,mel,options)
#print transciption
print(result.text)
