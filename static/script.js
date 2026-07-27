let lightMode = true;

const responses = [];
const botRepeatButtonIDToIndexMap = {};

const baseUrl = window.location.origin;

// ---------------- Loading ----------------

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

async function showBotLoadingAnimation() {
    await sleep(300);
    $(".loading-animation")[0].style.display = "inline-block";
}

function hideBotLoadingAnimation() {
    $(".loading-animation")[0].style.display = "none";
}

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

const populateUserMessage = (userMessage) => {

    $("#message-input").val("");

    $("#message-list").append(

        `<div class='message-line my-text'>
            <div class='message-box my-text${!lightMode ? " dark" : ""}'>
                <div class='me'>${userMessage}</div>
            </div>
        </div>`

    );

    scrollToBottom();

};

const populateBotResponse = async (userMessage) => {

    await showBotLoadingAnimation();

    const response = await processUserMessage(userMessage);

    responses.push(response);

    const id = getRandomID();

    botRepeatButtonIDToIndexMap[id] = responses.length - 1;

    hideBotLoadingAnimation();

    // No autoplay: response only plays when the speaker button is tapped.
    $("#message-list").append(

        `<div class='message-line'>

            <div class='message-box${!lightMode ? " dark" : ""}'>

                ${response.openaiResponseText}

            </div>

            <button
                id='${id}'
                class='btn volume repeat-button'
                title='Play response'

                onclick='playResponseAudio("data:audio/mpeg;base64," + responses[botRepeatButtonIDToIndexMap[this.id]].openaiResponseSpeech)'>

                <i class='fa fa-volume-up'></i>

            </button>

        </div>`

    );

    scrollToBottom();

};

// ---------------- UI ----------------

$(document).ready(function () {

    const sendMessage = () => {

        const message = cleanTextInput($("#message-input").val());

        if (message === "") return;

        populateUserMessage(message);

        populateBotResponse(message);

    };

    $("#message-input").keyup(function (event) {

        if (event.keyCode === 13) {

            sendMessage();

        }

    });

    $("#send-button").click(function () {

        sendMessage();

    });

    $("#light-dark-mode-switch").change(function () {

        $("body").toggleClass("dark-mode");

        $(".message-box").toggleClass("dark");

        $(".loading-dots").toggleClass("dark");

        $(".dot").toggleClass("dark-dot");

        lightMode = !lightMode;

    });

});
