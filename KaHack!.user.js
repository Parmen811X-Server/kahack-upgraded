// ==UserScript==
// @name         KaHack!
// @version      1.0.25
// @namespace    https://github.com/jokeri2222
// @description  A hack for kahoot.it!
// @updateURL    https://github.com/Parmen811X-Server/kahack-upgraded/blob/main/KaHack!.user.js
// @downloadURL  https://github.com/Parmen811X-Server/kahack-upgraded/blob/main/KaHack!.user.js
// @author       jokeri2222; https://github.com/jokeri2222
// @match        https://kahoot.it/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kahoot.it
// @grant        none
// ==/UserScript==
var Version = '1.0.25'

var questions = [];
var info = {
    numQuestions: 0,
    questionNum: -1,
    lastAnsweredQuestion: -1,
    defaultIL:true,
    ILSetQuestion:-1,
};
var PPT = 950;
var Answered_PPT = 950;
var autoAnswer = false;
var showAnswers = true;
var inputLag = 400;
var forceCorrectMode = false; // Controls stealth correction

function FindByAttributeValue(attribute, value, element_type) {
    element_type = element_type || "*";
    var All = document.getElementsByTagName(element_type);
    for (var i = 0; i < All.length; i++) {
        if (All[i].getAttribute(attribute) == value) { return All[i]; }
    }
}

// [Previous UI creation code remains exactly the same until showAnswersSwitch]

const showAnswersSwitch = document.createElement('label');
showAnswersSwitch.className = 'switch';
showAnswersSwitchContainer.appendChild(showAnswersSwitch);

const showAnswersInput = document.createElement('input');
showAnswersInput.type = 'checkbox';
showAnswersInput.addEventListener('change', function() {
    showAnswers = this.checked;
});
showAnswersSwitch.appendChild(showAnswersInput);

const showAnswersSlider = document.createElement('span');
showAnswersSlider.className = 'slider';
showAnswersSwitch.appendChild(showAnswersSlider);

// ====== STEALTH FORCE CORRECT TOGGLE ====== //
const forceContainer = document.createElement('div');
forceContainer.className = 'switch-container';
forceContainer.style.display = 'flex';
forceContainer.style.alignItems = 'center';
forceContainer.style.justifyContent = 'center';
uiElement.appendChild(forceContainer);

const forceLabel = document.createElement('span');
forceLabel.textContent = 'Stealth Force Correct';
forceLabel.className = 'switch-label';
forceLabel.style.fontFamily = '"Montserrat", sans-serif';
forceLabel.style.fontSize = '1.5vw';
forceLabel.style.color = 'white';
forceLabel.style.margin = '2.5vw';
forceContainer.appendChild(forceLabel);

const forceSwitch = document.createElement('label');
forceSwitch.className = 'switch';
forceContainer.appendChild(forceSwitch);

const forceInput = document.createElement('input');
forceInput.type = 'checkbox';
forceInput.addEventListener('change', function() {
    forceCorrectMode = this.checked;
});
forceSwitch.appendChild(forceInput);

const forceSlider = document.createElement('span');
forceSlider.className = 'slider';
forceSwitch.appendChild(forceSlider);
// ====== END TOGGLE ====== //

// [Rest of the original UI code remains the same until minimize function]

minimizeButton.addEventListener('click', () => {
    isMinimized = !isMinimized;
    if (isMinimized) {
        header.style.display = 'none';
        header2.style.display = 'none';
        header3.style.display = 'none';
        header4.style.display = 'none';
        inputContainer.style.display = 'none';
        questionsLabel.style.display = 'none';
        versionLabel.style.display = 'none';
        inputLagLabel.style.display='none';
        githubContainer.style.display = 'none';

        sliderContainer.style.display = 'none';
        autoAnswerSwitchContainer.style.display = 'none';
        showAnswersSwitchContainer.style.display = 'none';
        forceContainer.style.display = 'none'; // Added for stealth toggle

        uiElement.style.height = '2.5vw';
        handle.style.height = '100%';
        closeButton.style.height = '100%';
        minimizeButton.style.height = '100%';
    } else {
        header.style.display = 'block';
        header2.style.display = 'block';
        header3.style.display = 'block';
        header4.style.display = 'block';
        inputContainer.style.display = 'flex';
        questionsLabel.style.display = 'block';
        versionLabel.style.display = 'block';
        inputLagLabel.style.display='block';
        githubContainer.style.display = 'block';

        handle.style.height = '2.5vw';
        uiElement.style.height = 'auto';
        closeButton.style.height = '2.5vw';
        minimizeButton.style.height = '2.5vw';

        sliderContainer.style.display = 'flex';
        autoAnswerSwitchContainer.style.display = 'flex';
        showAnswersSwitchContainer.style.display = 'flex';
        forceContainer.style.display = 'flex'; // Added for stealth toggle
    }
});

// [Rest of original functions remain the same until the event listeners]

let isHidden = false;
document.addEventListener('keydown', (event)=> {
    if (event.key == "h" && event.altKey) {
        isHidden = !isHidden;
    }

    if (event.key == "x" && event.altKey) {
        document.body.removeChild(uiElement);
        autoAnswer = false;
        showAnswers = false;
    }

    if (isHidden) {
        uiElement.style.display = 'none';
    } else {
        uiElement.style.display = 'block';
    }
});

// ====== STEALTH CLICK HANDLER ====== //
document.addEventListener('mousedown', function(e) {
    if (!forceCorrectMode || e.button !== 0 || !questions[info.questionNum]) return;
    
    const clickedBtn = e.target.closest('button[data-functional-selector^="answer-"]');
    if (!clickedBtn) return;
    
    e.stopImmediatePropagation();
    e.preventDefault();
    
    const correctBtn = FindByAttributeValue(
        "data-functional-selector", 
        `answer-${questions[info.questionNum].answers[0]}`, 
        "button"
    );
    correctBtn.click();
}, true);
// ====== END HANDLER ====== //

setInterval(function() {
    var textElement = FindByAttributeValue("data-functional-selector", "question-index-counter", "div");
    if (textElement) {
        info.questionNum = +textElement.textContent - 1;
    }
    if (FindByAttributeValue("data-functional-selector", 'answer-0', "button") && info.lastAnsweredQuestion != info.questionNum) {
        info.lastAnsweredQuestion = info.questionNum;
        onQuestionStart();
    }
    if (autoAnswer) {
        if (info.ILSetQuestion != info.questionNum) {
            var ppt = Answered_PPT;
            if (ppt > 987) ppt = 1000;
            var incrementElement = FindByAttributeValue("data-functional-selector", "score-increment", "span");
            if (incrementElement) {
                info.ILSetQuestion = info.questionNum;
                var increment = +incrementElement.textContent.split(" ")[1];
                if (increment != 0) {
                    inputLag += (ppt-increment)*15;
                    if (inputLag < 0) {
                        inputLag -= (ppt-increment)*15;
                        inputLag += (ppt-increment/2)*15;
                    }
                    inputLag = Math.round(inputLag);
                }
            }
        }
    }
    questionsLabel.textContent = 'Question '+(info.questionNum+1)+' / '+info.numQuestions;
    inputLagLabel.textContent = 'Input lag : '+inputLag+' ms';
}, 1);
