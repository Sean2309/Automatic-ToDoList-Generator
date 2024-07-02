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
    btnClearRecording = document.getElementById('btn-clear-recording');
});


// ================================MISC FUNCTIONS START====================================
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

// Creates a new <audio> to replace the existing recording with the new one
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

// Replaces current audio source with new audio source. 
// Enables other buttons to be clicked
function stopRecordingCallback() {
    replaceAudio(URL.createObjectURL(recorder.getBlob()));
    saveToLocalStorage();

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

    btnTranscribeRecording.disabled = false;
}

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

function saveToLocalStorage() {
    console.log(`Recorder : ${recorder}`);
    var audioRecording = recorder.getBlob();
    if (!recorder || !audioRecording) return;  

    var reader = new FileReader();
    var fileName = getFileName('mp3');
    reader.readAsDataURL(audioRecording);
    reader.onloadend = function() {
        var res = reader.result;
        localStorage.setItem(fileName, res);

        console.log(`File Name is: ${fileName}`);
        // console.log(`Reader result: ${reader.result}`);
    };
}

// ================================MISC FUNCTIONS END====================================

// ================================BTN FUNCTIONS START====================================
function clearRecording() {
    localStorage.clear();
    console.log('local storage recordings cleared');
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
    // btnDownloadRecording.disabled = true;
    btnTranscribeRecording.disabled = true;
}

function stopRecording() {
    btnStopRecording.disabled = true;
    recorder.stopRecording(stopRecordingCallback);
}

// Download Recording doesn't download right now
// function downloadRecording() {
//     btnDownloadRecording.disabled = true;
//     if (!recorder || !recorder.getBlob()) return;

//     if (isSafari) {
//         recorder.getDataURL(function(dataURL) {
//             SaveToDisk(dataURL, getFileName('mp3'));
//         });
//         return;
//     }

//     var blob = recorder.getBlob();
//     var file = new File([blob], getFileName('mp3'), {
//         type: 'audio/mp3'
//     });
//     // invokeSaveAsDialog(file);
// }

// WIP

function downloadRecording(audioId) {
    const audioData = localStorage.getItem(audioId);
    if (audioData) {
        const link = document.createElement('a');
        link.href = audioData;
        link.download = audioId;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        console.error('Audio data not found in local storage');
    }
}
// function transcribeRecording() {
//     btnTranscribeRecording.disabled = true;

//     // Getting the recording
//     console.log('transcribing the recording now');
    
//     var audioReocording = recorder.getBlob();
//     if (!recorder || !audioReocording) return;  

//     // Saving to local storage
//     var reader = new FileReader();
//     reader.readAsDataURL(audioReocording);
//     reader.onloadend = function() {
//         localStorage.setItem('audioRecording1', reader.result);
//         console.log('added to local storage');

//         console.log('retrieving from local storage');
//         console.log(localStorage.getItem('audioRecording1'));
//         localStorage.removeItem('audioRecording1');
//     };
// };

function transcribeRecording() {
    btnTranscribeRecording.disabled = true;

    console.log('transcribing the recording now');

    // This is to send to the server for transcription purposes => Not implemented yet
    // TODO **
    // try {
    //     let response = fetch('/transcribe', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify({ audio: reader.result })
    //     });

    //     let data = response.json();

    //     // Update the audio logs array
    //     updateAudioLogs(reader.result, data.transcription);
    // } catch (error) {
    //     console.error('Error:', error);
    // }

    // Programmatically trigger the click event on a button if needed
    // const someButton = document.getElementById('some-button-id');
    // if (someButton) {
    //     click(someButton);
    // }
    
}

function updateAudioLogs(audioData, transcription) {
    // Add new log to the beginning of the array
    audioLogs.unshift({ audioData, transcription });

    // Keep only the last 5 logs
    if (audioLogs.length > 5) {
        audioLogs.pop();
    }

    // Update the UI
    displayAudioLogs();
}

function displayAudioLogs() {
    const container = document.getElementsByClassName('audio-display-container');
    container.innerHTML = ''; // Clear the container

    if (audioLogs.length > 0) {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }

    audioLogs.forEach((log, index) => {
        const logElement = document.createElement('div');
        logElement.className = 'audio-record-container';

        const audioData = localStorage.getItem(log.id);
        logElement.innerHTML = `
            <h3>Audio Log ${index + 1} hee</h3>
            <audio controls src="${audioData}"></audio>
            <p>Transcription: ${log.transcription || 'N/A'}</p>
            <div class="btn-container">
                <button class="btn display-audio-btn" onclick="viewAudio('${log.id}')">View Audio</button>
                <button class="btn btn-download-recording" onclick="downloadRecording('${log.id}')">Download Audio</button>
            </div>
        `;

        container.appendChild(logElement);
    });
}

function viewAudio(audioId) {
    const audioData = localStorage.getItem(audioId);
    if (audioData) {
        replaceAudio(audioData);
    } else {
        console.error('Audio data not found in local storage');
    }
}
// ================================BTN FUNCTIONS END====================================
