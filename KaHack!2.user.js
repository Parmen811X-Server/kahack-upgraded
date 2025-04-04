// ==UserScript==
// @name         KaHack!
// @version      1.0.26
// @namespace    https://github.com/jokeri2222
// @description  A hack for kahoot.it!
// @updateURL    https://github.com/jokeri2222/KaHack/raw/main/KaHack!.meta.js
// @downloadURL  https://github.com/jokeri2222/KaHack/raw/main/KaHack!.user.js
// @author       jokeri2222; https://github.com/jokeri2222
// @match        https://kahoot.it/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kahoot.it
// @grant        none
// ==/UserScript==
var Version = '1.0.26'

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
var showAnswers = false;
var inputLag = 100;
var randomizePoints = false;

function FindByAttributeValue(attribute, value, element_type)    {
  element_type = element_type || "*";
  var All = document.getElementsByTagName(element_type);
  for (var i = 0; i < All.length; i++)       {
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
uiElement.style.backgroundColor = '#381272';
uiElement.style.borderRadius = '1vw';
uiElement.style.boxShadow = '0px 0px 10px 0px rgba(0, 0, 0, 0.5)';
uiElement.style.zIndex = '9999';

const handle = document.createElement('div');
handle.className = 'handle';
handle.style.fontFamily = '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif;';
handle.style.fontSize = '1.5vw';
handle.textContent = 'KaHack!';
handle.style.color = 'white';
handle.style.width = '97.5%';
handle.style.height = '2.5vw';
handle.style.backgroundColor = '#321066';
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
closeButton.style.backgroundColor = 'red';
closeButton.style.color = 'white';
closeButton.style.borderRadius = '0 1vw 0 0';
closeButton.style.display = 'flex';
closeButton.style.justifyContent = 'center';
closeButton.style.alignItems = 'center';
closeButton.style.cursor = 'pointer';
handle.appendChild(closeButton);

const minimizeButton = document.createElement('div');
minimizeButton.className = 'minimize-button';
minimizeButton.textContent = '─';
minimizeButton.style.color = 'white';
minimizeButton.style.position = 'absolute';
minimizeButton.style.top = '0';
minimizeButton.style.right = '12.5%';
minimizeButton.style.width = '12.5%';
minimizeButton.style.height = '2.5vw';
minimizeButton.style.backgroundColor = 'gray';
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
header.style.color = 'white';
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
header2.style.color = 'white';
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
pointsLabel.style.color = 'white';
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

// Add Randomize Points Button
const randomizeButton = document.createElement('button');
randomizeButton.textContent = 'Randomize Points';
randomizeButton.style.fontFamily = '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif;';
randomizeButton.style.fontSize = '1.5vw';
randomizeButton.style.margin = '1vw auto';
randomizeButton.style.display = 'block';
randomizeButton.style.padding = '0.5vw 1vw';
randomizeButton.style.backgroundColor = '#4a148c';
randomizeButton.style.color = 'white';
randomizeButton.style.border = 'none';
randomizeButton.style.borderRadius = '0.5vw';
randomizeButton.style.cursor = 'pointer';
randomizeButton.addEventListener('click', () => {
    randomizePoints = !randomizePoints;
    if (randomizePoints) {
        randomizeButton.style.backgroundColor = '#7b1fa2';
        randomizeButton.textContent = 'Randomize Points: ON';
    } else {
        randomizeButton.style.backgroundColor = '#4a148c';
        randomizeButton.textContent = 'Randomize Points: OFF';
    }
});
uiElement.appendChild(randomizeButton);

const header3 = document.createElement('h2');
header3.textContent = 'ANSWERING';
header3.style.display = 'block';
header3.style.margin = '1vw';
header3.style.textAlign = 'center';
header3.style.fontFamily = '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif;';
header3.style.fontSize = '2vw';
header3.style.color = 'white';
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
autoAnswerLabel.style.color = 'white';
autoAnswerLabel.style.margin = '2.5vw'
autoAnswerSwitchContainer.appendChild(autoAnswerLabel);

const autoAnswerSwitch = document.createElement('label');
autoAnswerSwitch.className = 'switch';
autoAnswerSwitchContainer.appendChild(autoAnswerSwitch);

const autoAnswerInput = document.createElement('input');
autoAnswerInput.type = 'checkbox';
autoAnswerInput.addEventListener('change', function() {
    autoAnswer = this.checked;
    info.ILSetQuestion = info.questionNum
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
showAnswersLabel.style.color = 'white';
showAnswersLabel.style.margin = '2.5vw'
showAnswersSwitchContainer.appendChild(showAnswersLabel);

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


const style = document.createElement('style');
style.textContent = `
.custom-slider {
    background: white
    border: none;
    outline: none;
    cursor: ew-resize;
    appearance: none; /* Remove default appearance */
    height: 0; /* Set the height to match the thumb height */
}

.custom-slider::-webkit-slider-thumb {
    appearance: none; /* Remove default appearance */
    width: 1.75vw; /* Set width of the slider handle */
    height: 1.75vw; /* Set height of the slider handle */
    background-color: rgb(47, 47, 47); /* Set handle color to dark gray */
    border-radius: 50%; /* Create a circle for the handle */
    cursor: ew-resize; /* Horizontal resize cursor */
    margin-top: -0.5vw; /* Adjust margin-top to vertically center the thumb */
}

.custom-slider::-webkit-slider-runnable-track {
    width: 100%; /* Set track width to 100% */
    height: 0.75vw; /* Set track height to match the thumb height */
    background-color: white; /* Set track color to white */
    cursor: ew-resize; /* Horizontal resize cursor */
    border-radius: 1vw; /* Set rounded corners for the track */
    background: linear-gradient(to right, red, yellow, limegreen); /* Gradient from red to yellow to green */
}
