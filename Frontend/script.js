var audio;
var recorder; // globally accessible
var microphone;
var isEdge, isSafari;
var btnStartRecording, btnStopRecording, btnDownloadRecording;

document.addEventListener('DOMContentLoaded', function() {
    audio = document.querySelector('audio');

    isEdge = navigator.userAgent.indexOf('Edge') !== -1 && (!!navigator.msSaveOrOpenBlob || !!navigator.msSaveBlob);
    isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    btnStartRecording = document.getElementById('btn-start-recording');
    btnStopRecording = document.getElementById('btn-stop-recording');
    btnDownloadRecording = document.getElementById('btn-download-recording');
    btnTranscribeRecording = document.getElementById('btn-transcribe-recording');
});

function captureMicrophone(callback) {

    if (microphone) {
        callback(microphone);
        return;
    }

    if (typeof navigator.mediaDevices === 'undefined' || !navigator.mediaDevices.getUserMedia) {
        alert('This browser does not support WebRTC getUserMedia API.');

        if (!!navigator.getUserMedia) {
            alert('This browser seems to support deprecated getUserMedia API.');
        }
    }

    navigator.mediaDevices.getUserMedia({
        audio: isEdge ? true : {
            echoCancellation: false
        }
    }).then(function(mic) {
        callback(mic);
    }).catch(function(error) {
        alert('Unable to capture your microphone. Please check console logs.');
        console.error(error);
    });
}

function replaceAudio(src) {
    var newAudio = document.createElement('audio');
    newAudio.controls = true;
    newAudio.autoplay = true;

    if (src) {
        newAudio.src = src;
    }

    var parentNode = audio.parentNode;
    parentNode.innerHTML = '';
    parentNode.appendChild(newAudio);

    audio = newAudio;
}

function stopRecordingCallback() {
    replaceAudio(URL.createObjectURL(recorder.getBlob()));

    btnStartRecording.disabled = false;

    setTimeout(function() {
        if (!audio.paused) return;

        setTimeout(function() {
            if (!audio.paused) return;
            audio.play();
        }, 1000);

        audio.play();
    }, 300);

    audio.play();

    btnDownloadRecording.disabled = false;
}

function startRecording() {
    btnStartRecording.disabled = true;
    btnStartRecording.style.border = '';
    btnStartRecording.style.fontSize = '';

    if (!microphone) {
        captureMicrophone(function(mic) {
            microphone = mic;

            if (isSafari) {
                replaceAudio();

                audio.muted = true;
                audio.srcObject = microphone;

                btnStartRecording.disabled = false;
                btnStartRecording.style.border = '1px solid red';
                btnStartRecording.style.fontSize = '150%';

                alert('Please click startRecording button again. First time we tried to access your microphone. Now we will record it.');
                return;
            }

            click(btnStartRecording);
        });
        return;
    }

    replaceAudio();

    audio.muted = true;
    audio.srcObject = microphone;

    var options = {
        type: 'audio',
        numberOfAudioChannels: isEdge ? 1 : 2,
        checkForInactiveTracks: true,
        bufferSize: 16384
    };

    if (isSafari || isEdge) {
        options.recorderType = StereoAudioRecorder;
    }

    if (navigator.platform && navigator.platform.toString().toLowerCase().indexOf('win') === -1) {
        options.sampleRate = 48000; // or 44100 or remove this line for default
    }

    if (isSafari) {
        options.sampleRate = 44100;
        options.bufferSize = 4096;
        options.numberOfAudioChannels = 2;
    }

    if (recorder) {
        recorder.destroy();
        recorder = null;
    }

    recorder = RecordRTC(microphone, options);

    recorder.startRecording();

    btnStopRecording.disabled = false;
    btnDownloadRecording.disabled = true;
    btnTranscribeRecording.disabled = true;
}

function stopRecording() {
    btnStopRecording.disabled = true;
    btnTranscribeRecording.disabled = false;
    recorder.stopRecording(stopRecordingCallback);
}

function downloadRecording() {
    btnDownloadRecording.disabled = true;
    if (!recorder || !recorder.getBlob()) return;

    if (isSafari) {
        recorder.getDataURL(function(dataURL) {
            SaveToDisk(dataURL, getFileName('mp3'));
        });
        return;
    }

    var blob = recorder.getBlob();
    var file = new File([blob], getFileName('mp3'), {
        type: 'audio/mp3'
    });
    // invokeSaveAsDialog(file);
}

// WIP
function transcribeRecording() {
    btnTranscribeRecording.disabled = true;

    // Getting the recording
    console.log('transcribing the recording now');
    if (!recorder || !recorder.getBlob()) return;

    // if (isSafari) {
    //     recorder.getDataURL(function(dataURL) {
    //         SaveToDisk(dataURL, getFileName('mp3'));
    //     });
    //     return;
    // }

    // var blob = recorder.getBlob();
    // var file = new File([blob], getFileName('mp3'), {
    //     type: 'audio/mp3'
    // });

    var recordedAudio = recorder.getBlob();

    console.log(`Recorded file : ${recorder.getBlob()}`);
    

    // Saving to local storage
};

function click(el) {
    el.disabled = false; // make sure that element is not disabled
    var evt = document.createEvent('Event');
    evt.initEvent('click', true, true);
    el.dispatchEvent(evt);
}

function getFileName(fileExtension) {
    let date = new Date();
    
    // Extracting date components
    let day = String(date.getDate()).padStart(2, '0');
    let month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    let year = String(date.getFullYear()).slice(-2); // Getting last two digits of the year
    
    // Extracting time components
    let hours = String(date.getHours()).padStart(2, '0');
    let minutes = String(date.getMinutes()).padStart(2, '0');
    let seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}-${month}-${year}_${hours}-${minutes}-${seconds}_Audio.${fileExtension}`;
}

function SaveToDisk(fileURL, fileName) {
    // for non-IE
    if (!window.ActiveXObject) {
        var save = document.createElement('a');
        save.href = fileURL;
        save.download = fileName || 'unknown';
        save.style = 'display:none;opacity:0;color:transparent;';
        (document.body || document.documentElement).appendChild(save);

        if (typeof save.click === 'function') {
            save.click();
        } else {
            save.target = '_blank';
            var event = document.createEvent('Event');
            event.initEvent('click', true, true);
            save.dispatchEvent(event);
        }

        (window.URL || window.webkitURL).revokeObjectURL(save.href);
    }

    // for IE
    else if (!!window.ActiveXObject && document.execCommand) {
        var _window = window.open(fileURL, '_blank');
        _window.document.close();
        _window.document.execCommand('SaveAs', true, fileName || fileURL)
        _window.close();
    }
}
