let lightMode = true;
let recorder = null;
let recording = false;

const responses = [];
const botRepeatButtonIDToIndexMap = {};
const userRepeatButtonIDToRecordingMap = {};

const baseUrl = window.location.origin;

// ---------------- Loading ----------------

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

async function showBotLoadingAnimation() {
    await sleep(300);
    $(".loading-animation")[1].style.display = "inline-block";
}

function hideBotLoadingAnimation() {
    $(".loading-animation")[1].style.display = "none";
}

async function showUserLoadingAnimation() {
    await sleep(100);
    $(".loading-animation")[0].style.display = "flex";
}

function hideUserLoadingAnimation() {
    $(".loading-animation")[0].style.display = "none";
}

// ---------------- Speech To Text ----------------

const getSpeechToText = async (userRecording) => {

    const response = await fetch(baseUrl + "/speech-to-text", {
        method: "POST",
        body: userRecording.audioBlob
    });

    return await response.text();
};

// ---------------- Chat ----------------

const processUserMessage = async (userMessage) => {

    const response = await fetch(baseUrl + "/process-message", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            userMessage: userMessage
        })
    });

    return await response.json();
};

// ---------------- Utility ----------------

const cleanTextInput = (value) => {

    return value
        .trim()
        .replace(/[\n\t]/g, "")
        .replace(/<[^>]*>/g, "")
        .replace(/[<>&;]/g, "");
};

const recordAudio = () => {

    return new Promise(async (resolve) => {

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        const mediaRecorder = new MediaRecorder(stream);

        const audioChunks = [];

        mediaRecorder.addEventListener("dataavailable", (event) => {
            audioChunks.push(event.data);
        });

        const start = () => mediaRecorder.start();

        const stop = () =>

            new Promise((resolve) => {

                mediaRecorder.addEventListener("stop", () => {

                    const audioBlob = new Blob(audioChunks, {
                        type: "audio/webm"
                    });

                    const audioUrl = URL.createObjectURL(audioBlob);

                    const audio = new Audio(audioUrl);

                    const play = () => audio.play();

                    resolve({
                        audioBlob,
                        audioUrl,
                        play
                    });

                });

                mediaRecorder.stop();

            });

        resolve({
            start,
            stop
        });

    });

};

const toggleRecording = async () => {

    if (!recording) {

        recorder = await recordAudio();

        recording = true;

        recorder.start();

    } else {

        const audio = await recorder.stop();

        return audio;
    }
};

// ---------------- Audio ----------------

const playResponseAudio = (function () {

    const df = document.createDocumentFragment();

    return function Sound(src) {

        const snd = new Audio(src);

        df.appendChild(snd);

        snd.addEventListener("ended", function () {

            df.removeChild(snd);

        });

        snd.play();

        return snd;

    };

})();

// ---------------- Chat ----------------

const getRandomID = () => {

    return Date.now().toString(36) +
        Math.random().toString(36).substr(2);

};

const scrollToBottom = () => {

    $("#chat-window").animate({

        scrollTop: $("#chat-window")[0].scrollHeight

    });

};

const populateUserMessage = (userMessage, userRecording) => {

    $("#message-input").val("");

    if (userRecording) {

        const id = getRandomID();

        userRepeatButtonIDToRecordingMap[id] = userRecording;

        hideUserLoadingAnimation();

        $("#message-list").append(

            `<div class='message-line my-text'>
                <div class='message-box my-text${!lightMode ? " dark" : ""}'>
                    <div class='me'>${userMessage}</div>
                </div>

                <button id='${id}' class='btn volume repeat-button'
                onclick='userRepeatButtonIDToRecordingMap[this.id].play()'>
                    <i class='fa fa-volume-up'></i>
                </button>

            </div>`

        );

    } else {

        $("#message-list").append(

            `<div class='message-line my-text'>
                <div class='message-box my-text${!lightMode ? " dark" : ""}'>
                    <div class='me'>${userMessage}</div>
                </div>
            </div>`

        );

    }

    scrollToBottom();

};

const populateBotResponse = async (userMessage) => {

    await showBotLoadingAnimation();

    const response = await processUserMessage(userMessage);

    responses.push(response);

    const id = getRandomID();

    botRepeatButtonIDToIndexMap[id] = responses.length - 1;

    hideBotLoadingAnimation();

    $("#message-list").append(

        `<div class='message-line'>

            <div class='message-box${!lightMode ? " dark" : ""}'>

                ${response.openaiResponseText}

            </div>

            <button
                id='${id}'
                class='btn volume repeat-button'

                onclick='playResponseAudio("data:audio/mpeg;base64," + responses[botRepeatButtonIDToIndexMap[this.id]].openaiResponseSpeech)'>

                <i class='fa fa-volume-up'></i>

            </button>

        </div>`

    );

    playResponseAudio(
        "data:audio/mpeg;base64," +
        response.openaiResponseSpeech
    );

    scrollToBottom();

};

// ---------------- UI ----------------

$(document).ready(function () {

    $("#message-input").keyup(function (event) {

        let inputVal = cleanTextInput($("#message-input").val());

        if (event.keyCode === 13 && inputVal !== "") {

            populateUserMessage(inputVal, null);

            populateBotResponse(inputVal);

        }

        inputVal = $("#message-input").val();

        if (inputVal === "") {

            $("#send-button")
                .removeClass("send")
                .addClass("microphone")
                .html("<i class='fa fa-microphone'></i>");

        } else {

            $("#send-button")
                .removeClass("microphone")
                .addClass("send")
                .html("<i class='fa fa-paper-plane'></i>");

        }

    });

    $("#send-button").click(async function () {

        if ($("#send-button").hasClass("microphone") && !recording) {

            toggleRecording();

            $(".fa-microphone").css("color", "#f44336");

            recording = true;

        }

        else if (recording) {

            toggleRecording().then(async (userRecording) => {

                await showUserLoadingAnimation();

                const userMessage = await getSpeechToText(userRecording);

                populateUserMessage(userMessage, userRecording);

                populateBotResponse(userMessage);

            });

            $(".fa-microphone").css("color", "#125ee5");

            recording = false;

        }

        else {

            const message = cleanTextInput($("#message-input").val());

            if (message === "") return;

            populateUserMessage(message, null);

            populateBotResponse(message);

            $("#send-button")
                .removeClass("send")
                .addClass("microphone")
                .html("<i class='fa fa-microphone'></i>");

        }

    });

    $("#light-dark-mode-switch").change(function () {

        $("body").toggleClass("dark-mode");

        $(".message-box").toggleClass("dark");

        $(".loading-dots").toggleClass("dark");

        $(".dot").toggleClass("dark-dot");

        lightMode = !lightMode;

    });

});