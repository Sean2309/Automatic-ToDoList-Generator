var audio;
var recorder; // globally accessible
var microphone;
var isEdge, isSafari, isChrome;
var btnStartRecording, btnStopRecording, btnDownloadRecording;
var audioLogs = [];

document.addEventListener('DOMContentLoaded', function() {
    audio = document.querySelector('audio');

    isEdge = navigator.userAgent.indexOf('Edge') !== -1 && (!!navigator.msSaveOrOpenBlob || !!navigator.msSaveBlob);
    isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

    btnStartRecording = document.getElementById('btn-start-recording');
    btnStopRecording = document.getElementById('btn-stop-recording');
    btnClearRecording = document.getElementById('btn-clear-recording');

    // Load existing audio logs from localStorage
    loadAudioLogsFromLocalStorage();

    // Toggling the audio display container : Showing only if there are items in localStorage
    toggleAudioDisplayContainer();
});



// ================================MISC FUNCTIONS START====================================
function toggleAudioDisplayContainer() {
    let audioDisplayContainer = document.querySelector('.audio-display-container');
    if (localStorage.length === 0) {
        audioDisplayContainer.classList.add('hidden');
    } 
    else {
        audioDisplayContainer.classList.remove('hidden');
    }
}

function loadAudioLogsFromLocalStorage() {
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        let base64Audio = localStorage.getItem(key);
        injectAudioRecord(key, base64Audio);
    }
}

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
    var audioBlob = getBlob();
    replaceAudio(URL.createObjectURL(audioBlob));

    // Saves to Local Storage and Injects the Audio Container HTML
    saveToLocalStorage(audioBlob);

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

function getBlob() {
    return recorder.getBlob();
}

// Function to convert base64 to Blob
function base64ToBlob(base64Data) {
    var byteCharacters = atob(base64Data.split(',')[1]);
    var byteNumbers = new Array(byteCharacters.length);
    for (var i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    var byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'audio/mpeg' }); // Adjust 'audio/mpeg' to match your audio type
}

function saveToLocalStorage(audioBlob) {
    let reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = function() {
        let base64Audio = reader.result;
        let fileID = getFileName('wav');
        localStorage.setItem(fileID, base64Audio);
        injectAudioRecord(fileID, base64Audio);
        toggleAudioDisplayContainer();
    }
}

function injectAudioRecord(id, base64Audio) {
    // Create Container Div
    let containerDiv = document.createElement('div');
    containerDiv.className = 'audio-record-container';

    // Create h3 element
    let h3 = document.createElement('h3');
    h3.textContent = `Audio : ${id}`;
    containerDiv.appendChild(h3);

    // Create button container div
    let btnContainer = document.createElement('div');
    btnContainer.className = 'btn-container';
    containerDiv.appendChild(btnContainer);

    // Create View Button
    let viewBtn = document.createElement('button');
    viewBtn.className = 'btn display-audio-btn';
    viewBtn.textContent = 'View Audio';
    viewBtn.onclick = function() {
        replaceAudio(base64Audio);
    };
    btnContainer.appendChild(viewBtn);

    // Create Transcribe Button
    let transcribeBtn = document.createElement('button');
    transcribeBtn.className = 'btn display-audio-btn';
    transcribeBtn.textContent = 'Transcribe Audio';
    transcribeBtn.onclick = function() {
        console.log(`Transcribe Btn ${id} Clicked`);
        transcribeRecording(id);
    };
    btnContainer.appendChild(transcribeBtn);

    // Create Download Button
    let downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn display-audio-btn';
    downloadBtn.textContent = 'Download Audio';
    downloadBtn.onclick = function() {
        let audioURL = URL.createObjectURL(base64ToBlob(base64Audio));
        downloadRecording(audioURL, id);
    };
    btnContainer.appendChild(downloadBtn);

    // Inserting audio-record-container div to main container
    let audioDisplayContainer = document.querySelector('.audio-display-container');
    document.querySelector('.audio-display-container').insertBefore(containerDiv, audioDisplayContainer.firstChild);
}
// ================================MISC FUNCTIONS END====================================

// ================================BTN FUNCTIONS START====================================
function clearRecording() {
    localStorage.clear();
    document.querySelector('.audio-display-container').innerHTML = ''; // Clear the displayed audio logs
    console.log('local storage recordings cleared');
    toggleAudioDisplayContainer();
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
        mimeType: 'audio/wav',
        numberOfAudioChannels: isEdge ? 1 : 2,
        checkForInactiveTracks: true,
        bufferSize: 16384
    };

    if (isSafari || isEdge || isChrome) {
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
}

function stopRecording() {
    btnStopRecording.disabled = true;
    recorder.stopRecording(stopRecordingCallback);
}

function downloadRecording(fileURL, fileName) {
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

function transcribeRecording(fileName) {
    // Get audio file to pass to Python script
    let audioData = localStorage.getItem(fileName);
    // Send audio data to the server
    fetch('/transcribe', {
        method: "POST", // Default method is GET, so we need to change
        body: JSON.stringify({audioData : audioData}), // Data that is being sent
        headers: {
            "Content-Type": "application/json"
        }
        // Give the server info about request
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log(`Transcription ${fileName} : ${data.transcription}`);
        }
        else {
            console.log('Transcription failed', data.error);
        }
    })
    .catch(error => {
        console.error('Error: ', error);
    })
}