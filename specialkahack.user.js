// ==UserScript==
// @name         KaHack!
// @version      1.0.33
// @namespace    https://github.com/jokeri2222
// @description  A hack for kahoot.it!
// @updateURL    https://github.com/jokeri2222/KaHack/raw/main/KaHack!.meta.js
// @downloadURL  https://github.com/jokeri2222/KaHack/raw/main/KaHack!.user.js
// @author       jokeri2222; https://github.com/jokeri2222
// @match        https://kahoot.it/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kahoot.it
// @grant        none
// ==/UserScript==

var Version = '1.0.33'

var questions = [];
var info = {
    numQuestions: 0,
    questionNum: -1,
    lastAnsweredQuestion: -1,
    defaultIL: true,
    ILSetQuestion: -1,
};
var PPT = 950;
var Answered_PPT = 950;
var autoAnswer = false;
var showAnswers = false;
var inputLag = 100;
var isAltSPressed = false;
var isUIVisible = true;
var isAltRPressed = false;
var rainbowInterval = null;
var rainbowSpeed = 300; // Default speed in ms

// New color scheme
const colors = {
    primary: '#1a1a2e',
    secondary: '#16213e',
    accent: '#0f3460',
    text: '#e6e6e6',
    correct: '#4CAF50',
    incorrect: '#F44336',
    close: '#F44336',
    minimize: '#607D8B'
};

function FindByAttributeValue(attribute, value, element_type) {
    element_type = element_type || "*";
    var All = document.getElementsByTagName(element_type);
    for (var i = 0; i < All.length; i++) {
        if (All[i].getAttribute(attribute) == value) { return All[i]; }
    }
}

const uiElement = document.createElement('div');
uiElement.className = 'floating-ui';
uiElement.style.position = 'absolute';
uiElement.style.top = '5%';
uiElement.style.left = '5%';
uiElement.style.width = '33vw';
uiElement.style.height = 'auto';
uiElement.style.backgroundColor = colors.primary;
uiElement.style.borderRadius = '1vw';
uiElement.style.boxShadow = '0px 0px 10px 0px rgba(0, 0, 0, 0.5)';
uiElement.style.zIndex = '9999';

const handle = document.createElement('div');
handle.className = 'handle';
handle.style.fontFamily = '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif;';
handle.style.fontSize = '1.5vw';
handle.textContent = 'KaHack!';
handle.style.color = colors.text;
handle.style.width = '97.5%';
handle.style.height = '2.5vw';
handle.style.backgroundColor = colors.secondary;
handle.style.borderRadius = '1vw 1vw 0 0';
handle.style.cursor = 'grab';
handle.style.textAlign = 'left';
handle.style.paddingLeft = '2.5%';
handle.style.lineHeight = '2vw';
uiElement.appendChild(handle);

const closeButton = document.createElement('div');
closeButton.className = 'close-button';
closeButton.textContent = '✕';
closeButton.style.position = 'absolute';
closeButton.style.top = '0';
closeButton.style.right = '0';
closeButton.style.width = '12.5%';
closeButton.style.height = '2.5vw';
closeButton.style.backgroundColor = colors.close;
closeButton.style.color = colors.text;
closeButton.style.borderRadius = '0 1vw 0 0';
closeButton.style.display = 'flex';
closeButton.style.justifyContent = 'center';
closeButton.style.alignItems = 'center';
closeButton.style.cursor = 'pointer';
handle.appendChild(closeButton);

const minimizeButton = document.createElement('div');
minimizeButton.className = 'minimize-button';
minimizeButton.textContent = '─';
minimizeButton.style.color = colors.text;
minimizeButton.style.position = 'absolute';
minimizeButton.style.top = '0';
minimizeButton.style.right = '12.5%';
minimizeButton.style.width = '12.5%';
minimizeButton.style.height = '2.5vw';
minimizeButton.style.backgroundColor = colors.minimize;
minimizeButton.style.borderRadius = '0 0 0 0';
minimizeButton.style.display = 'flex';
minimizeButton.style.justifyContent = 'center';
minimizeButton.style.alignItems = 'center';
minimizeButton.style.cursor = 'pointer';
handle.appendChild(minimizeButton);

const header = document.createElement('h2');
header.textContent = 'QUIZ ID';
header.style.display = 'block';
header.style.margin = '1vw';
header.style.textAlign = 'center';
header.style.fontFamily = '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif;';
header.style.fontSize = '2vw';
header.style.color = colors.text;
header.style.textShadow = `
  -1px -1px 0 rgb(47, 47, 47),
  1px -1px 0 rgb(47, 47, 47),
  -1px 1px 0 rgb(47, 47, 47),
  1px 1px 0 rgb(47, 47, 47)
`;
uiElement.appendChild(header);

const inputContainer = document.createElement('div');
inputContainer.style.display = 'flex';
inputContainer.style.justifyContent = 'center';

const inputBox = document.createElement('input');
inputBox.type = 'text';
inputBox.style.color = 'black';
inputBox.placeholder = 'Quiz Id here...';
inputBox.style.width = '27.8vw';
inputBox.style.height = '1.5vw';
inputBox.style.margin = '0vw';
inputBox.style.padding = '0vw';
inputBox.style.padding = '0';
inputBox.style.border = '.1vw solid black';
inputBox.style.borderRadius = '1vw';
inputBox.style.outline = 'none';
inputBox.style.textAlign = 'center';
inputBox.style.fontSize = '1.15vw';
inputContainer.appendChild(inputBox);
uiElement.appendChild(inputContainer);

const header2 = document.createElement('h2');
header2.textContent = 'POINTS PER QUESTION';
header2.style.display = 'block';
header2.style.margin = '1vw';
header2.style.textAlign = 'center';
header2.style.fontFamily = '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif;';
header2.style.fontSize = '2vw';
header2.style.color = colors.text;
header2.style.textShadow = `
  -1px -1px 0 rgb(47, 47, 47),
  1px -1px 0 rgb(47, 47, 47),
  -1px 1px 0 rgb(47, 47, 47),
  1px 1px 0 rgb(47, 47, 47)
`;
uiElement.appendChild(header2);

const sliderContainer = document.createElement('div');
sliderContainer.style.width = '80%';
sliderContainer.style.margin = '1vw auto';
sliderContainer.style.display = 'flex';
sliderContainer.style.alignItems = 'center';
sliderContainer.style.justifyContent = 'center';

const pointsLabel = document.createElement('span');
pointsLabel.textContent = 'Points per Question: 950';
pointsLabel.style.fontFamily = '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif;';
pointsLabel.style.fontSize = '1.5vw';
pointsLabel.style.margin = '1vw';
pointsLabel.style.marginLeft = '1vw';
pointsLabel.style.marginRight = '1vw';
pointsLabel.style.color = colors.text;
sliderContainer.appendChild(pointsLabel);

const pointsSlider = document.createElement('input');
pointsSlider.type = 'range';
pointsSlider.min = '500';
pointsSlider.max = '1000';
pointsSlider.value = '950';
pointsSlider.style.width = '70%';
pointsSlider.style.marginLeft = '1vw';
pointsSlider.style.marginRight = '1vw';
pointsSlider.style.border = 'none';
pointsSlider.style.outline = 'none';
pointsSlider.style.cursor = 'ew-resize';
pointsSlider.className = 'custom-slider';
sliderContainer.appendChild(pointsSlider);
uiElement.appendChild(sliderContainer);

pointsSlider.addEventListener('input', () => {
    const points = +pointsSlider.value;
    PPT = points;
    pointsLabel.textContent = 'Points per Question: ' + points;
});

const header3 = document.createElement('h2');
header3.textContent = 'ANSWERING';
header3.style.display = 'block';
header3.style.margin = '1vw';
header3.style.textAlign = 'center';
header3.style.fontFamily = '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif;';
header3.style.fontSize = '2vw';
header3.style.color = colors.text;
header3.style.textShadow = `
  -1px -1px 0 rgb(47, 47, 47),
  1px -1px 0 rgb(47, 47, 47),
  -1px 1px 0 rgb(47, 47, 47),
  1px 1px 0 rgb(47, 47, 47)
`;
uiElement.appendChild(header3);

const autoAnswerSwitchContainer = document.createElement('div');
autoAnswerSwitchContainer.className = 'switch-container';
autoAnswerSwitchContainer.style.display = 'flex';
autoAnswerSwitchContainer.style.alignItems = 'center';
autoAnswerSwitchContainer.style.justifyContent = 'center';
uiElement.appendChild(autoAnswerSwitchContainer);

const autoAnswerLabel = document.createElement('span');
autoAnswerLabel.textContent = 'Auto Answer';
autoAnswerLabel.className = 'switch-label';
autoAnswerLabel.style.fontFamily = '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif;';
autoAnswerLabel.style.fontSize = '1.5vw';
autoAnswerLabel.style.color = colors.text;
autoAnswerLabel.style.margin = '2.5vw';
autoAnswerSwitchContainer.appendChild(autoAnswerLabel);

const autoAnswerSwitch = document.createElement('label');
autoAnswerSwitch.className = 'switch';
autoAnswerSwitchContainer.appendChild(autoAnswerSwitch);

const autoAnswerInput = document.createElement('input');
autoAnswerInput.type = 'checkbox';
autoAnswerInput.addEventListener('change', function() {
    autoAnswer = this.checked;
    info.ILSetQuestion = info.questionNum;
});
autoAnswerSwitch.appendChild(autoAnswerInput);

const autoAnswerSlider = document.createElement('span');
autoAnswerSlider.className = 'slider';
autoAnswerSwitch.appendChild(autoAnswerSlider);

const showAnswersSwitchContainer = document.createElement('div');
showAnswersSwitchContainer.className = 'switch-container';
showAnswersSwitchContainer.style.display = 'flex';
showAnswersSwitchContainer.style.alignItems = 'center';
showAnswersSwitchContainer.style.justifyContent = 'center';
uiElement.appendChild(showAnswersSwitchContainer);

const showAnswersLabel = document.createElement('span');
showAnswersLabel.textContent = 'Show Answers';
showAnswersLabel.className = 'switch-label';
showAnswersLabel.style.fontFamily = '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif;';
showAnswersLabel.style.fontSize = '1.5vw';
showAnswersLabel.style.color = colors.text;
showAnswersLabel.style.margin = '2.5vw';
showAnswersSwitchContainer.appendChild(showAnswersLabel);

const showAnswersSwitch = document.createElement('label');
showAnswersSwitch.className = 'switch';
showAnswersSwitchContainer.appendChild(showAnswersSwitch);

const showAnswersInput = document.createElement('input');
showAnswersInput.type = 'checkbox';
showAnswersInput.addEventListener('change', function() {
    showAnswers = this.checked;
    if (!showAnswers && !isAltSPressed) {
        resetAnswerColors();
    }
});
showAnswersSwitch.appendChild(showAnswersInput);

const showAnswersSlider = document.createElement('span');
showAnswersSlider.className = 'slider';
showAnswersSwitch.appendChild(showAnswersSlider);

// Rainbow Speed Slider
const rainbowSpeedContainer = document.createElement('div');
rainbowSpeedContainer.style.width = '80%';
rainbowSpeedContainer.style.margin = '1vw auto';
rainbowSpeedContainer.style.display = 'flex';
rainbowSpeedContainer.style.alignItems = 'center';
rainbowSpeedContainer.style.justifyContent = 'center';

const rainbowSpeedLabel = document.createElement('span');
rainbowSpeedLabel.textContent = 'Rainbow Speed: 300ms';
rainbowSpeedLabel.style.fontFamily = '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif;';
rainbowSpeedLabel.style.fontSize = '1.5vw';
rainbowSpeedLabel.style.margin = '1vw';
rainbowSpeedLabel.style.marginLeft = '1vw';
rainbowSpeedLabel.style.marginRight = '1vw';
rainbowSpeedLabel.style.color = colors.text;
rainbowSpeedContainer.appendChild(rainbowSpeedLabel);

const rainbowSpeedSlider = document.createElement('input');
rainbowSpeedSlider.type = 'range';
rainbowSpeedSlider.min = '50';
rainbowSpeedSlider.max = '1000';
rainbowSpeedSlider.value = '300';
rainbowSpeedSlider.style.width = '70%';
rainbowSpeedSlider.style.marginLeft = '1vw';
rainbowSpeedSlider.style.marginRight = '1vw';
rainbowSpeedSlider.style.border = 'none';
rainbowSpeedSlider.style.outline = 'none';
rainbowSpeedSlider.style.cursor = 'ew-resize';
rainbowSpeedSlider.className = 'custom-slider';
rainbowSpeedContainer.appendChild(rainbowSpeedSlider);
uiElement.appendChild(rainbowSpeedContainer);

rainbowSpeedSlider.addEventListener('input', () => {
    rainbowSpeed = +rainbowSpeedSlider.value;
    rainbowSpeedLabel.textContent = 'Rainbow Speed: ' + rainbowSpeed + 'ms';
    if (isAltRPressed) {
        startRainbowEffect();
    }
});

const keybindsContainer = document.createElement('div');
keybindsContainer.style.textAlign = 'center';
keybindsContainer.style.margin = '1vw';
const keybindsLabel = document.createElement('span');
keybindsLabel.innerHTML = 'Keybinds:<br>SHIFT - Toggle UI<br>ALT+W - Answer correctly<br>ALT+S (hold) - Show answers<br>ALT+R (hold) - Rainbow mode';
keybindsLabel.style.fontFamily = '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif;';
keybindsLabel.style.fontSize = '1.5vw';
keybindsLabel.style.color = colors.text;
keybindsContainer.appendChild(keybindsLabel);
uiElement.appendChild(keybindsContainer);

const style = document.createElement('style');
style.textContent = `
.custom-slider {
    background: white;
    border: none;
    outline: none;
    cursor: ew-resize;
    appearance: none;
    height: 0;
}

.custom-slider::-webkit-slider-thumb {
    appearance: none;
    width: 1.75vw;
    height: 1.75vw;
    background-color: ${colors.accent};
    border-radius: 50%;
    cursor: ew-resize;
    margin-top: -0.5vw;
}

.custom-slider::-webkit-slider-runnable-track {
    width: 100%;
    height: 0.75vw;
    background-color: white;
    cursor: ew-resize;
    border-radius: 1vw;
    background: linear-gradient(to right, red, yellow, limegreen);
}

:root {
  --switch-width: 5.9vw;
  --switch-height: 3.3vw;
  --slider-size: 2.5vw;
  --slider-thumb-size: 1.3vw;
}

.switch {
  position: relative;
  display: inline-block;
  width: var(--switch-width);
  height: var(--switch-height);
  margin: 2.5vw;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #F44336;
  transition: 0.8s;
  border-radius: .5vw;
}

.slider:before {
  position: absolute;
  content: "";
  height: var(--slider-size);
  width: var(--slider-size);
  left: calc(var(--slider-thumb-size) / 3);
  bottom: calc(var(--slider-thumb-size) / 3);
  background-color: rgb(43, 43, 43);
  transition: 0.8s;
  border-radius: .5vw;
}

input:checked + .slider {
  background-color: #4CAF50;
}

input:focus + .slider {
  box-shadow: 0 0 1px #4CAF50;
}

input:checked + .slider:before {
  transform: translateX(calc(var(--slider-size)));
}
`;
document.head.appendChild(style);

const header4 = document.createElement('h2');
header4.textContent = 'INFO';
header4.style.display = 'block';
header4.style.margin = '1vw';
header4.style.textAlign = 'center';
header4.style.fontFamily = '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif;';
header4.style.fontSize = '2vw';
header4.style.color = colors.text;
header4.style.textShadow = `
  -1px -1px 0 rgb(47, 47, 47),
  1px -1px 0 rgb(47, 47, 47),
  -1px 1px 0 rgb(47, 47, 47),
  1px 1px 0 rgb(47, 47, 47)
`;
uiElement.appendChild(header4);

const questionsLabel = document.createElement('span');
questionsLabel.textContent = 'Question 0 / 0';
questionsLabel.style.display = 'block';
questionsLabel.style.fontFamily = '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif;';
questionsLabel.style.fontSize = '1.5vw';
questionsLabel.style.textAlign = 'center';
questionsLabel.style.margin = '1vw';
questionsLabel.style.marginLeft = '1vw';
questionsLabel.style.marginRight = '1vw';
questionsLabel.style.color = colors.text;
uiElement.appendChild(questionsLabel);

const inputLagLabel = document.createElement('span');
inputLagLabel.textContent = 'Input lag : 125 ms';
inputLagLabel.style.display = 'block';
inputLagLabel.style.fontFamily = '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif;';
inputLagLabel.style.fontSize = '1.5vw';
inputLagLabel.style.textAlign = 'center';
inputLagLabel.style.margin = '1vw';
inputLagLabel.style.marginLeft = '1vw';
inputLagLabel.style.marginRight = '1vw';
inputLagLabel.style.color = colors.text;
uiElement.appendChild(inputLagLabel);

const versionLabel = document.createElement('h1');
versionLabel.textContent = 'KaHack! V'+Version;
versionLabel.style.fontFamily = '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif;';
versionLabel.style.fontSize = '2.5vw';
versionLabel.style.display = 'block';
versionLabel.style.textAlign = 'center';
versionLabel.style.marginTop = '3.5vw';
versionLabel.style.marginLeft = '1vw';
versionLabel.style.marginRight = '1vw';
versionLabel.style.color = colors.text;
uiElement.appendChild(versionLabel);

const githubContainer = document.createElement('div');
githubContainer.style.textAlign = 'center';
githubContainer.style.marginTop = '1vw';

const githubLabel = document.createElement('span');
githubLabel.textContent = 'GitHub: ';
githubLabel.style.fontFamily = '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif;';
githubLabel.style.fontSize = '1.5vw';
githubLabel.style.margin = '0 1vw';
githubLabel.style.color = colors.text;
githubContainer.appendChild(githubLabel);

const githubUrl = document.createElement('a');
githubUrl.textContent = 'jokeri2222';
githubUrl.href = 'https://github.com/jokeri2222';
githubUrl.target = '_blank';
githubUrl.style.fontFamily = '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif;';
githubUrl.style.fontSize = '1.5vw';
githubUrl.style.margin = '0 1vw';
githubUrl.style.color = colors.text;
githubContainer.appendChild(githubUrl);

const githubUrl2 = document.createElement('a');
githubUrl2.textContent = 'Epic0001';
githubUrl2.href = 'https://github.com/Epic0001';
githubUrl2.target = '_blank';
githubUrl2.style.fontFamily = '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif;';
githubUrl2.style.fontSize = '1.5vw';
githubUrl2.style.margin = '0 1vw';
githubUrl2.style.color = colors.text;
githubContainer.appendChild(githubUrl2);

uiElement.appendChild(githubContainer);

closeButton.addEventListener('click', () => {
    document.body.removeChild(uiElement);
    autoAnswer = false;
    showAnswers = false;
    stopRainbowEffect();
});

let isMinimized = false;

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
        keybindsContainer.style.display = 'none';
        sliderContainer.style.display = 'none';
        autoAnswerSwitchContainer.style.display = 'none';
        showAnswersSwitchContainer.style.display = 'none';
        rainbowSpeedContainer.style.display = 'none';
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
        keybindsContainer.style.display = 'block';
        rainbowSpeedContainer.style.display = 'flex';
        handle.style.height = '2.5vw';
        uiElement.style.height = 'auto';
        closeButton.style.height = '2.5vw';
        minimizeButton.style.height = '2.5vw';
        sliderContainer.style.display = 'flex';
        autoAnswerSwitchContainer.style.display = 'flex';
        showAnswersSwitchContainer.style.display = 'flex';
    }
});

function parseQuestions(questionsJson) {
    let questions = []
    questionsJson.forEach(function (question) {
        let q = {type:question.type, time:question.time}
        if (['quiz', 'multiple_select_quiz'].includes(question.type)) {
            var i=0
            q.answers = []
            q.incorrectAnswers = []
            question.choices.forEach(function(choise) {
                if (choise.correct) {
                    q.answers.push(i)
                }
                else {
                    q.incorrectAnswers.push(i)
                }
                i++
            })
        }
        if (question.type == 'open_ended') {
            q.answers = []
            question.choices.forEach(function(choise) {
                q.answers.push(choise.answer)
            })
        }
        questions.push(q)
    })
    return questions
}

function handleInputChange() {
    const quizID = inputBox.value;
    const url = 'https://kahoot.it/rest/kahoots/' + quizID;

    if (quizID != "") {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('');
                }
                return response.json();
            })
            .then(data => {
                inputBox.style.backgroundColor = colors.correct;
                questions = parseQuestions(data.questions);
                info.numQuestions = questions.length;
            })
            .catch(error => {
                inputBox.style.backgroundColor = colors.incorrect;
                info.numQuestions = 0;
            });
    } else {
        inputBox.style.backgroundColor = 'white';
        info.numQuestions = 0;
    }
}

inputBox.addEventListener('input', handleInputChange);

document.body.appendChild(uiElement);

let isDragging = false;
let offsetX, offsetY;

handle.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - uiElement.getBoundingClientRect().left;
    offsetY = e.clientY - uiElement.getBoundingClientRect().top;
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        uiElement.style.left = x + 'px';
        uiElement.style.top = y + 'px';
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

function resetAnswerColors() {
    const answerButtons = document.querySelectorAll('button[data-functional-selector^="answer-"], button[data-functional-selector^="multi-select-button-"]');
    answerButtons.forEach(button => {
        button.style.removeProperty('background-color');
        button.style.removeProperty('transition');
    });
}

function startRainbowEffect() {
    if (rainbowInterval) {
        clearInterval(rainbowInterval);
        rainbowInterval = null;
    }
    
    const rainbowColors = [
        '#FF0000', '#FF7F00', '#FFFF00', 
        '#00FF00', '#0000FF', '#4B0082', 
        '#9400D3', '#FF1493', '#FF69B4'
    ];
    
    // Apply to all buttons immediately
    const answerButtons = document.querySelectorAll('button[data-functional-selector^="answer-"], button[data-functional-selector^="multi-select-button-"]');
    answerButtons.forEach(button => {
        const randomColor = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
        button.style.setProperty('background-color', randomColor, 'important');
        button.style.setProperty('transition', `background-color ${rainbowSpeed/1000}s`, 'important');
    });
    
    // Set up interval to keep changing colors
    rainbowInterval = setInterval(() => {
        const currentButtons = document.querySelectorAll('button[data-functional-selector^="answer-"], button[data-functional-selector^="multi-select-button-"]');
        currentButtons.forEach(button => {
            const randomColor = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
            button.style.setProperty('background-color', randomColor, 'important');
        });
    }, rainbowSpeed);
}

function stopRainbowEffect() {
    if (rainbowInterval) {
        clearInterval(rainbowInterval);
        rainbowInterval = null;
    }
    resetAnswerColors();
}

function onQuestionStart() {
    var question = questions[info.questionNum];
    if (showAnswers || isAltSPressed) {
        highlightAnswers(question);
    }
    if (autoAnswer) {
        answer(question, (question.time - question.time / (500/(PPT-500))) - inputLag);
    }
}

function highlightAnswers(question) {
    if (!question) return;
    
    const answerButtons = document.querySelectorAll('button[data-functional-selector^="answer-"], button[data-functional-selector^="multi-select-button-"]');
    
    // Reset all buttons first
    answerButtons.forEach(button => {
        button.style.removeProperty('background-color');
    });
    
    // Highlight correct answers
    question.answers?.forEach(answer => {
        const btn = FindByAttributeValue("data-functional-selector", 'answer-'+answer, "button") || 
                     FindByAttributeValue("data-functional-selector", 'multi-select-button-'+answer, "button");
        if (btn) {
            btn.style.setProperty('background-color', colors.correct, 'important');
        }
    });
    
    // Highlight incorrect answers
    question.incorrectAnswers?.forEach(answer => {
        const btn = FindByAttributeValue("data-functional-selector", 'answer-'+answer, "button") || 
                    FindByAttributeValue("data-functional-selector", 'multi-select-button-'+answer, "button");
        if (btn) {
            btn.style.setProperty('background-color', colors.incorrect, 'important');
        }
    });
}

function answer(question, time) {
    Answered_PPT = PPT;
    
    var delay = 0;
    if (question.type == 'multiple_select_quiz') delay = 60;
    
    setTimeout(function() {
        if (question.type == 'quiz') {
            const key = (+question.answers[0]+1).toString();
            const event = new KeyboardEvent('keydown', { key });
            window.dispatchEvent(event);
        }
        if (question.type == 'multiple_select_quiz') {
            question.answers.forEach(function (answer) {
                const key = (+answer+1).toString();
                const event = new KeyboardEvent('keydown', { key });
                window.dispatchEvent(event);
            });
            setTimeout(function() {
               FindByAttributeValue("data-functional-selector", 'multi-select-submit-button', "button").click();
            }, 0);
        }
    }, time - delay);
}

// Keybind handlers
document.addEventListener('keydown', function(e) {
    // SHIFT - Toggle UI visibility (only if no other modifiers)
    if (e.key === 'Shift' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        isUIVisible = !isUIVisible;
        uiElement.style.display = isUIVisible ? 'block' : 'none';
        return;
    }
    
    // Prevent other keybinds from working when UI is hidden
    if (!isUIVisible) return;
    
    // ALT+W - Answer correctly
    if (e.key.toLowerCase() === 'w' && e.altKey && info.questionNum !== -1 && questions[info.questionNum]) {
        e.preventDefault();
        e.stopPropagation();
        
        const question = questions[info.questionNum];
        if (!question || !question.answers || question.answers.length === 0) return;
        
        if (question.type === 'quiz') {
            const key = (+question.answers[0]+1).toString();
            const event = new KeyboardEvent('keydown', { key });
            window.dispatchEvent(event);
        } else if (question.type === 'multiple_select_quiz') {
            question.answers.forEach(function(answer) {
                const key = (+answer+1).toString();
                const event = new KeyboardEvent('keydown', { key });
                window.dispatchEvent(event);
            });
            setTimeout(() => {
                const submitBtn = FindByAttributeValue("data-functional-selector", 'multi-select-submit-button', "button");
                if (submitBtn) submitBtn.click();
            }, 50);
        }
    }
    
    // ALT+S - Show answers while held
    if (e.key.toLowerCase() === 's' && e.altKey && info.questionNum !== -1 && questions[info.questionNum]) {
        e.preventDefault();
        e.stopPropagation();
        isAltSPressed = true;
        highlightAnswers(questions[info.questionNum]);
    }
    
    // ALT+R - Rainbow mode while held
    if (e.key.toLowerCase() === 'r' && e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        if (!isAltRPressed) {
            isAltRPressed = true;
            startRainbowEffect();
        }
    }
});

document.addEventListener('keyup', function(e) {
    // ALT+S released - hide answers
    if (e.key.toLowerCase() === 's' && isAltSPressed) {
        isAltSPressed = false;
        if (!showAnswers) {
            resetAnswerColors();
        }
    }
    
    // ALT+R released - stop rainbow mode
    if (e.key.toLowerCase() === 'r' && isAltRPressed) {
        isAltRPressed = false;
        stopRainbowEffect();
    }
});

setInterval(function () {
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
                    inputLagLabel.textContent = 'Input lag : '+inputLag+' ms';
                }
            }
        }
    }
    questionsLabel.textContent = 'Question '+(info.questionNum+1)+' / '+info.numQuestions;
}, 1);
