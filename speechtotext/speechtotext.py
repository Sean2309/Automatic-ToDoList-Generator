import speech_recognition as sr
from pydub import AudioSegment

r = sr.Recognizer()
src= (r"speechtotext/aiaudio.mp3")
sound = AudioSegment.from_mp3(src)
sound.export("speechtotext/aiaudio.wav", format="wav")
file_audio = sr.AudioFile(r'speechtotext/aiaudio.wav')

r = sr.Recognizer()
with file_audio as source:
    audio_text = r.record(source)

print(r.recognize_google(audio_text))
