// ==UserScript==
// @name         KaHack!
// @version      1.0.34
// @namespace    https://github.com/jokeri2222
// @description  A hack for kahoot.it!
// @updateURL    https://github.com/jokeri2222/KaHack/raw/main/KaHack!.meta.js
// @downloadURL  https://github.com/jokeri2222/KaHack/raw/main/KaHack!.user.js
// @author       jokeri2222; https://github.com/jokeri2222
// @match        https://kahoot.it/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kahoot.it
// @grant        none
// ==/UserScript==

var Version = '1.0.34'

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
var rainbowSpeed = 300;

// New UI color scheme and design
const colors = {
    primary: '#1a1a2e',
    secondary: '#16213e',
    accent: '#0f3460',
    text: '#e6e6e6',
    correct: '#4CAF50',
    incorrect: '#F44336',
    close: '#F44336',
    minimize: '#607D8B',
    sliderThumb: '#333333'
};

function FindByAttributeValue(attribute, value, element_type) {
    element_type = element_type || "*";
    var All = document.getElementsByTagName(element_type);
    for (var i = 0; i < All.length; i++) {
        if (All[i].getAttribute(attribute) == value) { return All[i]; }
    }
}

// Create main UI container with new design
const uiElement = document.createElement('div');
uiElement.className = 'kahack-container';
Object.assign(uiElement.style, {
    position: 'fixed',
    top: '20px',
    left: '20px',
    width: '350px',
    backgroundColor: colors.primary,
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    zIndex: '9999',
    overflow: 'hidden',
    border: `1px solid ${colors.accent}`,
    transition: 'all 0.3s ease'
});

// Create animated KaHack logo overlay
const logoOverlay = document.createElement('div');
Object.assign(logoOverlay.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, rgba(26,26,46,0.9) 0%, rgba(22,33,62,0.9) 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '32px',
    fontWeight: 'bold',
    color: 'white',
    textShadow: '0 0 10px rgba(255,255,255,0.5)',
    opacity: '0',
    pointerEvents: 'none',
    transition: 'opacity 0.5s ease',
    zIndex: '10000',
    borderRadius: '12px'
});
logoOverlay.textContent = 'KaHack';
uiElement.appendChild(logoOverlay);

// Show/hide logo on hover
uiElement.addEventListener('mouseenter', () => {
    logoOverlay.style.opacity = '1';
});
uiElement.addEventListener('mouseleave', () => {
    logoOverlay.style.opacity = '0';
});

// Create header/drag handle
const handle = document.createElement('div');
handle.className = 'kahack-header';
Object.assign(handle.style, {
    padding: '12px 15px',
    backgroundColor: colors.secondary,
    color: colors.text,
    cursor: 'grab',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    userSelect: 'none',
    borderBottom: `1px solid ${colors.accent}`
});

const title = document.createElement('div');
title.textContent = 'KaHack!';
Object.assign(title.style, {
    fontSize: '18px',
    fontWeight: 'bold'
});

const buttonContainer = document.createElement('div');
Object.assign(buttonContainer.style, {
    display: 'flex',
    gap: '5px'
});

const minimizeButton = document.createElement('div');
minimizeButton.textContent = '─';
Object.assign(minimizeButton.style, {
    width: '24px',
    height: '24px',
    backgroundColor: colors.minimize,
    color: colors.text,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
});

const closeButton = document.createElement('div');
closeButton.textContent = '✕';
Object.assign(closeButton.style, {
    width: '24px',
    height: '24px',
    backgroundColor: colors.close,
    color: colors.text,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '4px',
    cursor: 'pointer'
});

buttonContainer.appendChild(minimizeButton);
buttonContainer.appendChild(closeButton);
handle.appendChild(title);
handle.appendChild(buttonContainer);
uiElement.appendChild(handle);

// Create content container
const content = document.createElement('div');
content.className = 'kahack-content';
Object.assign(content.style, {
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
});

// Create section function
function createSection(titleText) {
    const section = document.createElement('div');
    Object.assign(section.style, {
        backgroundColor: colors.secondary,
        borderRadius: '8px',
        padding: '12px',
        border: `1px solid ${colors.accent}`
    });

    const header = document.createElement('h3');
    header.textContent = titleText;
    Object.assign(header.style, {
        margin: '0 0 10px 0',
        color: colors.text,
        fontSize: '16px'
    });

    section.appendChild(header);
    return { section, body: section };
}

// Quiz ID Section
const quizIdSection = createSection('QUIZ ID');
const inputBox = document.createElement('input');
Object.assign(inputBox.style, {
    width: '100%',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #555',
    backgroundColor: '#fff',
    color: '#000',
    fontSize: '14px'
});
inputBox.placeholder = 'Enter Quiz ID...';
quizIdSection.body.appendChild(inputBox);
content.appendChild(quizIdSection.section);

// Points Section
const pointsSection = createSection('POINTS PER QUESTION');
const pointsSliderContainer = document.createElement('div');
Object.assign(pointsSliderContainer.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
});

const pointsLabel = document.createElement('span');
pointsLabel.textContent = '950';
Object.assign(pointsLabel.style, {
    color: colors.text,
    fontSize: '14px',
    minWidth: '40px',
    textAlign: 'center'
});

const pointsSlider = document.createElement('input');
pointsSlider.type = 'range';
pointsSlider.min = '500';
pointsSlider.max = '1000';
pointsSlider.value = '950';
Object.assign(pointsSlider.style, {
    flex: '1',
    height: '6px',
    borderRadius: '3px',
    backgroundColor: '#555',
    outline: 'none'
});

pointsSliderContainer.appendChild(pointsSlider);
pointsSliderContainer.appendChild(pointsLabel);
pointsSection.body.appendChild(pointsSliderContainer);
content.appendChild(pointsSection.section);

// Answering Section
const answeringSection = createSection('ANSWERING');

function createToggle(labelText, checked, onChange) {
    const container = document.createElement('div');
    Object.assign(container.style, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: '8px 0'
    });

    const label = document.createElement('span');
    label.textContent = labelText;
    Object.assign(label.style, {
        color: colors.text,
        fontSize: '14px'
    });

    const toggle = document.createElement('label');
    Object.assign(toggle.style, {
        position: 'relative',
        display: 'inline-block',
        width: '50px',
        height: '24px'
    });

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    Object.assign(input.style, {
        opacity: '0',
        width: '0',
        height: '0'
    });

    const slider = document.createElement('span');
    Object.assign(slider.style, {
        position: 'absolute',
        cursor: 'pointer',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: colors.incorrect,
        transition: '.4s',
        borderRadius: '24px'
    });

    const sliderBefore = document.createElement('span');
    Object.assign(sliderBefore.style, {
        position: 'absolute',
        content: '""',
        height: '16px',
        width: '16px',
        left: '4px',
        bottom: '4px',
        backgroundColor: '#fff',
        transition: '.4s',
        borderRadius: '50%'
    });

    input.addEventListener('change', function() {
        onChange(this.checked);
        slider.style.backgroundColor = this.checked ? colors.correct : colors.incorrect;
    });

    toggle.appendChild(input);
    toggle.appendChild(slider);
    slider.appendChild(sliderBefore);
    container.appendChild(label);
    container.appendChild(toggle);

    return container;
}

answeringSection.body.appendChild(createToggle('Auto Answer', autoAnswer, function(checked) {
    autoAnswer = checked;
    info.ILSetQuestion = info.questionNum;
}));

answeringSection.body.appendChild(createToggle('Show Answers', showAnswers, function(checked) {
    showAnswers = checked;
    if (!showAnswers && !isAltSPressed) {
        resetAnswerColors();
    }
}));

// Rainbow Speed Section
const rainbowSection = createSection('RAINBOW SPEED');
const rainbowSliderContainer = document.createElement('div');
Object.assign(rainbowSliderContainer.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
});

const rainbowLabel = document.createElement('span');
rainbowLabel.textContent = '300ms';
Object.assign(rainbowLabel.style, {
    color: colors.text,
    fontSize: '14px',
    minWidth: '50px',
    textAlign: 'center'
});

const rainbowSlider = document.createElement('input');
rainbowSlider.type = 'range';
rainbowSlider.min = '50';
rainbowSlider.max = '1000';
rainbowSlider.value = '300';
Object.assign(rainbowSlider.style, {
    flex: '1',
    height: '6px',
    borderRadius: '3px',
    backgroundColor: '#555',
    outline: 'none'
});

rainbowSliderContainer.appendChild(rainbowSlider);
rainbowSliderContainer.appendChild(rainbowLabel);
rainbowSection.body.appendChild(rainbowSliderContainer);
content.appendChild(rainbowSection.section);

// Keybinds Section
const keybindsSection = createSection('KEYBINDS');
const keybindsText = document.createElement('div');
keybindsText.innerHTML = `
    <div style="color: ${colors.text}; font-size: 13px; line-height: 1.5;">
        <strong>SHIFT</strong> - Toggle UI<br>
        <strong>ALT+W</strong> - Answer correctly<br>
        <strong>ALT+S</strong> - Show answers (hold)<br>
        <strong>ALT+R</strong> - Rainbow mode (hold)
    </div>
`;
keybindsSection.body.appendChild(keybindsText);
content.appendChild(keybindsSection.section);

// Info Section
const infoSection = createSection('INFO');
const infoContent = document.createElement('div');
Object.assign(infoContent.style, {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    color: colors.text,
    fontSize: '14px'
});

const questionsLabel = document.createElement('div');
questionsLabel.textContent = 'Question: 0/0';
infoContent.appendChild(questionsLabel);

const inputLagLabel = document.createElement('div');
inputLagLabel.textContent = 'Input lag: 100ms';
infoContent.appendChild(inputLagLabel);

const versionLabel = document.createElement('div');
versionLabel.textContent = `Version: ${Version}`;
infoContent.appendChild(versionLabel);

infoSection.body.appendChild(infoContent);
content.appendChild(infoSection.section);

// GitHub Section
const githubSection = createSection('DEVELOPERS');
const githubContent = document.createElement('div');
Object.assign(githubContent.style, {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px'
});

function createGithubLink(username) {
    const link = document.createElement('a');
    link.href = `https://github.com/${username}`;
    link.target = '_blank';
    link.textContent = username;
    Object.assign(link.style, {
        color: colors.text,
        textDecoration: 'none',
        fontSize: '14px'
    });
    return link;
}

githubContent.appendChild(createGithubLink('jokeri2222'));
githubContent.appendChild(createGithubLink('Epic0001'));
githubSection.body.appendChild(githubContent);
content.appendChild(githubSection.section);

// Add content to UI
uiElement.appendChild(content);

// Add UI to document
document.body.appendChild(uiElement);

// Event listeners for UI controls
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
        content.style.display = 'none';
        uiElement.style.width = 'auto';
        uiElement.style.height = 'auto';
    } else {
        content.style.display = 'flex';
        uiElement.style.width = '350px';
    }
});

pointsSlider.addEventListener('input', () => {
    PPT = +pointsSlider.value;
    pointsLabel.textContent = PPT;
});

rainbowSlider.addEventListener('input', () => {
    rainbowSpeed = +rainbowSlider.value;
    rainbowLabel.textContent = `${rainbowSpeed}ms`;
    if (isAltRPressed) {
        startRainbowEffect();
    }
});

// Rainbow effect functions
function startRainbowEffect() {
    if (rainbowInterval) {
        clearInterval(rainbowInterval);
        rainbowInterval = null;
    }
    
    const rainbowColors = [
        '#FF0000', '#FF7F00', '#FFFF00',
        '#00FF00', '#0000FF', '#4B0082',
        '#9400D3'
    ];
    
    const answerButtons = document.querySelectorAll(
        'button[data-functional-selector^="answer-"], ' +
        'button[data-functional-selector^="multi-select-button-"]'
    );
    
    function applyColors() {
        answerButtons.forEach(button => {
            const randomColor = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
            button.style.setProperty('background-color', randomColor, 'important');
            button.style.setProperty('transition', `background-color ${rainbowSpeed/1000}s ease`, 'important');
        });
    }
    
    applyColors();
    rainbowInterval = setInterval(applyColors, rainbowSpeed);
}

function stopRainbowEffect() {
    if (rainbowInterval) {
        clearInterval(rainbowInterval);
        rainbowInterval = null;
    }
    resetAnswerColors();
}

function resetAnswerColors() {
    const answerButtons = document.querySelectorAll(
        'button[data-functional-selector^="answer-"], ' +
        'button[data-functional-selector^="multi-select-button-"]'
    );
    answerButtons.forEach(button => {
        button.style.removeProperty('background-color');
        button.style.removeProperty('transition');
    });
}

// Dragging functionality
let isDragging = false;
let offsetX, offsetY;

handle.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - uiElement.getBoundingClientRect().left;
    offsetY = e.clientY - uiElement.getBoundingClientRect().top;
    uiElement.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        
        // Keep UI within window bounds
        const maxX = window.innerWidth - uiElement.offsetWidth;
        const maxY = window.innerHeight - uiElement.offsetHeight;
        
        uiElement.style.left = `${Math.min(Math.max(0, x), maxX)}px`;
        uiElement.style.top = `${Math.min(Math.max(0, y), maxY)}px`;
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    uiElement.style.cursor = '';
});

// Quiz functions
function parseQuestions(questionsJson) {
    let questions = [];
    questionsJson.forEach(function(question) {
        let q = { type: question.type, time: question.time };
        
        if (['quiz', 'multiple_select_quiz'].includes(question.type)) {
            q.answers = [];
            q.incorrectAnswers = [];
            question.choices.forEach(function(choice, i) {
                if (choice.correct) {
                    q.answers.push(i);
                } else {
                    q.incorrectAnswers.push(i);
                }
            });
        }
        
        if (question.type == 'open_ended') {
            q.answers = question.choices.map(choice => choice.answer);
        }
        
        questions.push(q);
    });
    return questions;
}

function handleInputChange() {
    const quizID = inputBox.value.trim();
    
    if (!quizID) {
        inputBox.style.backgroundColor = 'white';
        info.numQuestions = 0;
        questionsLabel.textContent = 'Question: 0/0';
        return;
    }
    
    fetch(`https://kahoot.it/rest/kahoots/${quizID}`)
        .then(response => {
            if (!response.ok) throw new Error('Invalid quiz ID');
            return response.json();
        })
        .then(data => {
            inputBox.style.backgroundColor = colors.correct;
            questions = parseQuestions(data.questions);
            info.numQuestions = questions.length;
            questionsLabel.textContent = `Question: 0/${info.numQuestions}`;
        })
        .catch(error => {
            inputBox.style.backgroundColor = colors.incorrect;
            info.numQuestions = 0;
            questionsLabel.textContent = 'Question: 0/0';
        });
}

inputBox.addEventListener('input', handleInputChange);

function highlightAnswers(question) {
    if (!question) return;
    
    const answerButtons = document.querySelectorAll(
        'button[data-functional-selector^="answer-"], ' +
        'button[data-functional-selector^="multi-select-button-"]'
    );
    
    // Reset all buttons first
    answerButtons.forEach(button => {
        button.style.removeProperty('background-color');
    });
    
    // Highlight correct answers
    question.answers?.forEach(answer => {
        const btn = FindByAttributeValue("data-functional-selector", `answer-${answer}`, "button") || 
                     FindByAttributeValue("data-functional-selector", `multi-select-button-${answer}`, "button");
        if (btn) {
            btn.style.setProperty('background-color', colors.correct, 'important');
        }
    });
    
    // Highlight incorrect answers
    question.incorrectAnswers?.forEach(answer => {
        const btn = FindByAttributeValue("data-functional-selector", `answer-${answer}`, "button") || 
                    FindByAttributeValue("data-functional-selector", `multi-select-button-${answer}`, "button");
        if (btn) {
            btn.style.setProperty('background-color', colors.incorrect, 'important');
        }
    });
}

function answer(question, time) {
    Answered_PPT = PPT;
    const delay = question.type == 'multiple_select_quiz' ? 60 : 0;
    
    setTimeout(() => {
        if (question.type == 'quiz') {
            const key = (question.answers[0] + 1).toString();
            window.dispatchEvent(new KeyboardEvent('keydown', { key }));
        } else if (question.type == 'multiple_select_quiz') {
            question.answers.forEach(answer => {
                const key = (answer + 1).toString();
                window.dispatchEvent(new KeyboardEvent('keydown', { key }));
            });
            
            setTimeout(() => {
                const submitBtn = FindByAttributeValue("data-functional-selector", 'multi-select-submit-button', "button");
                if (submitBtn) submitBtn.click();
            }, 0);
        }
    }, time - delay);
}

function onQuestionStart() {
    const question = questions[info.questionNum];
    if (!question) return;
    
    if (showAnswers || isAltSPressed) {
        highlightAnswers(question);
    }
    
    if (autoAnswer) {
        const answerTime = (question.time - question.time / (500 / (PPT - 500))) - inputLag;
        answer(question, answerTime);
    }
}

// Keybind handlers
document.addEventListener('keydown', function(e) {
    // SHIFT - Toggle UI visibility
    if (e.key === 'Shift' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        isUIVisible = !isUIVisible;
        uiElement.style.display = isUIVisible ? 'block' : 'none';
        return;
    }
    
    if (!isUIVisible) return;
    
    // ALT+W - Answer correctly
    if (e.key.toLowerCase() === 'w' && e.altKey && info.questionNum !== -1) {
        e.preventDefault();
        const question = questions[info.questionNum];
        if (!question?.answers?.length) return;
        
        if (question.type === 'quiz') {
            const key = (question.answers[0] + 1).toString();
            window.dispatchEvent(new KeyboardEvent('keydown', { key }));
        } else if (question.type === 'multiple_select_quiz') {
            question.answers.forEach(answer => {
                const key = (answer + 1).toString();
                window.dispatchEvent(new KeyboardEvent('keydown', { key }));
            });
            
            setTimeout(() => {
                const submitBtn = FindByAttributeValue("data-functional-selector", 'multi-select-submit-button', "button");
                if (submitBtn) submitBtn.click();
            }, 50);
        }
    }
    
    // ALT+S - Show answers while held
    if (e.key.toLowerCase() === 's' && e.altKey && info.questionNum !== -1) {
        e.preventDefault();
        isAltSPressed = true;
        highlightAnswers(questions[info.questionNum]);
    }
    
    // ALT+R - Rainbow mode while held
    if (e.key.toLowerCase() === 'r' && e.altKey && !isAltRPressed) {
        e.preventDefault();
        isAltRPressed = true;
        startRainbowEffect();
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

// Main interval
setInterval(() => {
    // Update question number
    const questionCounter = FindByAttributeValue("data-functional-selector", "question-index-counter", "div");
    if (questionCounter) {
        info.questionNum = parseInt(questionCounter.textContent) - 1;
        questionsLabel.textContent = `Question: ${info.questionNum + 1}/${info.numQuestions}`;
    }
    
    // Detect new question
    if (FindByAttributeValue("data-functional-selector", 'answer-0', "button") && 
        info.lastAnsweredQuestion != info.questionNum) {
        info.lastAnsweredQuestion = info.questionNum;
        onQuestionStart();
    }
    
    // Update input lag for auto-answer
    if (autoAnswer && info.ILSetQuestion != info.questionNum) {
        const incrementElement = FindByAttributeValue("data-functional-selector", "score-increment", "span");
        if (incrementElement) {
            const incrementText = incrementElement.textContent;
            const increment = parseInt(incrementText.split(" ")[1]);
            
            if (!isNaN(increment) {
                info.ILSetQuestion = info.questionNum;
                let ppt = Answered_PPT > 987 ? 1000 : Answered_PPT;
                let adjustment = (ppt - increment) * 15;
                
                if (inputLag + adjustment < 0) {
                    adjustment = (ppt - increment / 2) * 15;
                }
                
                inputLag = Math.max(0, Math.round(inputLag + adjustment));
                inputLagLabel.textContent = `Input lag: ${inputLag}ms`;
            }
        }
    }
}, 50);

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
.kahack-container * {
    box-sizing: border-box;
    font-family: 'Montserrat', sans-serif;
}

input[type="range"] {
    -webkit-appearance: none;
    height: 6px;
    background: #555;
    border-radius: 3px;
}

input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: ${colors.sliderThumb};
    border-radius: 50%;
    cursor: pointer;
}

.kahack-header {
    transition: background-color 0.2s ease;
}

.kahack-header:hover {
    background-color: ${colors.accent} !important;
}

.kahack-content {
    transition: opacity 0.3s ease;
}

.kahack-section {
    transition: transform 0.2s ease;
}

.kahack-section:hover {
    transform: translateY(-2px);
}
`;
document.head.appendChild(style);
