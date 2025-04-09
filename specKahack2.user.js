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

var Version = '1.0.33';

// Configuration object
var config = {
    questions: [],
    info: {
        numQuestions: 0,
        questionNum: -1,
        lastAnsweredQuestion: -1,
        defaultIL: true,
        ILSetQuestion: -1,
    },
    PPT: 950,
    Answered_PPT: 950,
    autoAnswer: false,
    showAnswers: false,
    inputLag: 100,
    isAltSPressed: false,
    isUIVisible: true,
    isAltRPressed: false,
    rainbowInterval: null,
    rainbowSpeed: 300,
    theme: {
        primary: '#1a1a2e',
        secondary: '#16213e',
        accent: '#0f3460',
        text: '#e6e6e6',
        correct: '#4CAF50',
        incorrect: '#F44336'
    }
};

// UI Elements
const uiElement = document.createElement('div');
uiElement.className = 'floating-ui';
Object.assign(uiElement.style, {
    position: 'fixed',
    top: '5%',
    left: '5%',
    width: '33vw',
    height: 'auto',
    backgroundColor: config.theme.primary,
    borderRadius: '1vw',
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.5)',
    zIndex: '9999',
    transition: 'all 0.3s ease'
});

// Handle for dragging
const handle = document.createElement('div');
handle.className = 'handle';
Object.assign(handle.style, {
    fontFamily: '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: '1.5vw',
    textContent: 'KaHack!',
    color: config.theme.text,
    width: '97.5%',
    height: '2.5vw',
    backgroundColor: config.theme.secondary,
    borderRadius: '1vw 1vw 0 0',
    cursor: 'grab',
    textAlign: 'left',
    paddingLeft: '2.5%',
    lineHeight: '2vw',
    userSelect: 'none'
});
uiElement.appendChild(handle);

// Close button
const closeButton = document.createElement('div');
closeButton.className = 'close-button';
closeButton.textContent = '✕';
Object.assign(closeButton.style, {
    position: 'absolute',
    top: '0',
    right: '0',
    width: '12.5%',
    height: '2.5vw',
    backgroundColor: '#F44336',
    color: config.theme.text,
    borderRadius: '0 1vw 0 0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer'
});
handle.appendChild(closeButton);

// Minimize button
const minimizeButton = document.createElement('div');
minimizeButton.className = 'minimize-button';
minimizeButton.textContent = '─';
Object.assign(minimizeButton.style, {
    position: 'absolute',
    top: '0',
    right: '12.5%',
    width: '12.5%',
    height: '2.5vw',
    backgroundColor: '#607D8B',
    color: config.theme.text,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer'
});
handle.appendChild(minimizeButton);

// Helper function to create headers
function createHeader(text) {
    const header = document.createElement('h2');
    header.textContent = text;
    Object.assign(header.style, {
        display: 'block',
        margin: '1vw',
        textAlign: 'center',
        fontFamily: '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: '2vw',
        color: config.theme.text,
        textShadow: `
            -1px -1px 0 rgb(47, 47, 47),
            1px -1px 0 rgb(47, 47, 47),
            -1px 1px 0 rgb(47, 47, 47),
            1px 1px 0 rgb(47, 47, 47)`
    });
    return header;
}

// Quiz ID Section
uiElement.appendChild(createHeader('QUIZ ID'));

const inputContainer = document.createElement('div');
inputContainer.style.display = 'flex';
inputContainer.style.justifyContent = 'center';

const inputBox = document.createElement('input');
inputBox.type = 'text';
Object.assign(inputBox.style, {
    color: 'black',
    placeholder: 'Quiz Id here...',
    width: '27.8vw',
    height: '1.5vw',
    margin: '0',
    padding: '0',
    border: '.1vw solid black',
    borderRadius: '1vw',
    outline: 'none',
    textAlign: 'center',
    fontSize: '1.15vw'
});
inputContainer.appendChild(inputBox);
uiElement.appendChild(inputContainer);

// Points Per Question Section
uiElement.appendChild(createHeader('POINTS PER QUESTION'));

const sliderContainer = document.createElement('div');
Object.assign(sliderContainer.style, {
    width: '80%',
    margin: '1vw auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
});

const pointsLabel = document.createElement('span');
pointsLabel.textContent = `Points per Question: ${config.PPT}`;
Object.assign(pointsLabel.style, {
    fontFamily: '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: '1.5vw',
    margin: '1vw',
    color: config.theme.text
});
sliderContainer.appendChild(pointsLabel);

const pointsSlider = document.createElement('input');
pointsSlider.type = 'range';
pointsSlider.min = '500';
pointsSlider.max = '1000';
pointsSlider.value = config.PPT;
Object.assign(pointsSlider.style, {
    width: '70%',
    margin: '0 1vw',
    border: 'none',
    outline: 'none',
    cursor: 'ew-resize'
});
pointsSlider.className = 'custom-slider';
sliderContainer.appendChild(pointsSlider);
uiElement.appendChild(sliderContainer);

pointsSlider.addEventListener('input', () => {
    config.PPT = +pointsSlider.value;
    pointsLabel.textContent = `Points per Question: ${config.PPT}`;
});

// Answering Section
uiElement.appendChild(createHeader('ANSWERING'));

// Helper function to create toggle switches
function createToggleSwitch(labelText, checked, onChange) {
    const container = document.createElement('div');
    Object.assign(container.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    });

    const label = document.createElement('span');
    label.textContent = labelText;
    Object.assign(label.style, {
        fontFamily: '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: '1.5vw',
        color: config.theme.text,
        margin: '2.5vw'
    });
    container.appendChild(label);

    const switchLabel = document.createElement('label');
    switchLabel.className = 'switch';
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.addEventListener('change', onChange);
    switchLabel.appendChild(input);
    
    const slider = document.createElement('span');
    slider.className = 'slider';
    switchLabel.appendChild(slider);
    
    container.appendChild(switchLabel);
    return container;
}

// Auto Answer Toggle
uiElement.appendChild(createToggleSwitch('Auto Answer', config.autoAnswer, function() {
    config.autoAnswer = this.checked;
    config.info.ILSetQuestion = config.info.questionNum;
}));

// Show Answers Toggle
uiElement.appendChild(createToggleSwitch('Show Answers', config.showAnswers, function() {
    config.showAnswers = this.checked;
    if (config.showAnswers && config.info.questionNum !== -1) {
        highlightAnswers(config.questions[config.info.questionNum]);
    } else {
        resetAnswerColors();
    }
}));

// Rainbow Speed Section
const rainbowSpeedContainer = document.createElement('div');
Object.assign(rainbowSpeedContainer.style, {
    width: '80%',
    margin: '1vw auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
});

const rainbowSpeedLabel = document.createElement('span');
rainbowSpeedLabel.textContent = `Rainbow Speed: ${config.rainbowSpeed}ms`;
Object.assign(rainbowSpeedLabel.style, {
    fontFamily: '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: '1.5vw',
    margin: '1vw',
    color: config.theme.text
});
rainbowSpeedContainer.appendChild(rainbowSpeedLabel);

const rainbowSpeedSlider = document.createElement('input');
rainbowSpeedSlider.type = 'range';
rainbowSpeedSlider.min = '50';
rainbowSpeedSlider.max = '1000';
rainbowSpeedSlider.value = config.rainbowSpeed;
Object.assign(rainbowSpeedSlider.style, {
    width: '70%',
    margin: '0 1vw',
    border: 'none',
    outline: 'none',
    cursor: 'ew-resize'
});
rainbowSpeedSlider.className = 'custom-slider';
rainbowSpeedContainer.appendChild(rainbowSpeedSlider);
uiElement.appendChild(rainbowSpeedContainer);

rainbowSpeedSlider.addEventListener('input', () => {
    config.rainbowSpeed = +rainbowSpeedSlider.value;
    rainbowSpeedLabel.textContent = `Rainbow Speed: ${config.rainbowSpeed}ms`;
    if (config.isAltRPressed) {
        startRainbowEffect();
    }
});

// Keybinds Section
const keybindsContainer = document.createElement('div');
Object.assign(keybindsContainer.style, {
    textAlign: 'center',
    margin: '1vw'
});

const keybindsLabel = document.createElement('span');
keybindsLabel.innerHTML = 'Keybinds:<br>SHIFT - Toggle UI<br>ALT+W - Answer correctly<br>ALT+S (hold) - Show answers<br>ALT+R (hold) - Rainbow mode';
Object.assign(keybindsLabel.style, {
    fontFamily: '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: '1.5vw',
    color: config.theme.text
});
keybindsContainer.appendChild(keybindsLabel);
uiElement.appendChild(keybindsContainer);

// Info Section
uiElement.appendChild(createHeader('INFO'));

const questionsLabel = document.createElement('span');
questionsLabel.textContent = 'Question 0 / 0';
Object.assign(questionsLabel.style, {
    display: 'block',
    fontFamily: '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: '1.5vw',
    textAlign: 'center',
    margin: '1vw',
    color: config.theme.text
});
uiElement.appendChild(questionsLabel);

const inputLagLabel = document.createElement('span');
inputLagLabel.textContent = `Input lag: ${config.inputLag} ms`;
Object.assign(inputLagLabel.style, {
    display: 'block',
    fontFamily: '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: '1.5vw',
    textAlign: 'center',
    margin: '1vw',
    color: config.theme.text
});
uiElement.appendChild(inputLagLabel);

// Version Section
const versionLabel = document.createElement('h1');
versionLabel.textContent = `KaHack! V${Version}`;
Object.assign(versionLabel.style, {
    fontFamily: '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: '2.5vw',
    display: 'block',
    textAlign: 'center',
    margin: '3.5vw 1vw 1vw',
    color: config.theme.text
});
uiElement.appendChild(versionLabel);

// GitHub Section
const githubContainer = document.createElement('div');
Object.assign(githubContainer.style, {
    textAlign: 'center',
    margin: '1vw'
});

const githubLabel = document.createElement('span');
githubLabel.textContent = 'GitHub: ';
Object.assign(githubLabel.style, {
    fontFamily: '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: '1.5vw',
    margin: '0 1vw',
    color: config.theme.text
});
githubContainer.appendChild(githubLabel);

const githubUrl = document.createElement('a');
githubUrl.textContent = 'jokeri2222';
githubUrl.href = 'https://github.com/jokeri2222';
githubUrl.target = '_blank';
Object.assign(githubUrl.style, {
    fontFamily: '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: '1.5vw',
    margin: '0 1vw',
    color: config.theme.text,
    textDecoration: 'none'
});
githubContainer.appendChild(githubUrl);

const githubUrl2 = document.createElement('a');
githubUrl2.textContent = 'Epic0001';
githubUrl2.href = 'https://github.com/Epic0001';
githubUrl2.target = '_blank';
Object.assign(githubUrl2.style, {
    fontFamily: '"Montserrat", "Noto Sans Arabic", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: '1.5vw',
    margin: '0 1vw',
    color: config.theme.text,
    textDecoration: 'none'
});
githubContainer.appendChild(githubUrl2);

uiElement.appendChild(githubContainer);

// CSS Styles
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
    background-color: ${config.theme.accent};
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

.switch {
    position: relative;
    display: inline-block;
    width: 5.9vw;
    height: 3.3vw;
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
    transition: 0.4s;
    border-radius: .5vw;
}

.slider:before {
    position: absolute;
    content: "";
    height: 2.5vw;
    width: 2.5vw;
    left: 0.4vw;
    bottom: 0.4vw;
    background-color: rgb(43, 43, 43);
    transition: 0.4s;
    border-radius: .5vw;
}

input:checked + .slider {
    background-color: #4CAF50;
}

input:focus + .slider {
    box-shadow: 0 0 1px #4CAF50;
}

input:checked + .slider:before {
    transform: translateX(2.5vw);
}
`;
document.head.appendChild(style);

// UI Event Listeners
closeButton.addEventListener('click', () => {
    document.body.removeChild(uiElement);
    config.autoAnswer = false;
    config.showAnswers = false;
    stopRainbowEffect();
});

let isMinimized = false;
const toggleMinimize = () => {
    isMinimized = !isMinimized;
    const elementsToToggle = [
        uiElement.querySelectorAll('h2'),
        inputContainer,
        questionsLabel,
        versionLabel,
        inputLagLabel,
        githubContainer,
        keybindsContainer,
        sliderContainer,
        rainbowSpeedContainer,
        ...uiElement.querySelectorAll('.switch-container')
    ].flat();
    
    elementsToToggle.forEach(el => {
        if (el instanceof NodeList) {
            el.forEach(e => e.style.display = isMinimized ? 'none' : 'block');
        } else {
            el.style.display = isMinimized ? 'none' : 
                el === inputContainer ? 'flex' : 
                el === sliderContainer || el === rainbowSpeedContainer ? 'flex' : 'block';
        }
    });
    
    Object.assign(uiElement.style, {
        height: isMinimized ? '2.5vw' : 'auto'
    });
    
    Object.assign(handle.style, {
        height: isMinimized ? '100%' : '2.5vw',
        borderRadius: isMinimized ? '1vw' : '1vw 1vw 0 0'
    });
    
    [closeButton, minimizeButton].forEach(btn => {
        btn.style.height = isMinimized ? '100%' : '2.5vw';
    });
};

minimizeButton.addEventListener('click', toggleMinimize);

// Helper function to find elements by attribute
const findElementByAttribute = (attribute, value, elementType = '*') => {
    return document.querySelector(`${elementType}[${attribute}="${value}"]`);
};

// Parse questions from Kahoot API response
const parseQuestions = (questionsJson) => {
    return questionsJson.map(question => {
        const q = { type: question.type, time: question.time };
        
        if (['quiz', 'multiple_select_quiz'].includes(question.type)) {
            q.answers = [];
            q.incorrectAnswers = [];
            
            question.choices.forEach((choice, i) => {
                if (choice.correct) {
                    q.answers.push(i);
                } else {
                    q.incorrectAnswers.push(i);
                }
            });
        }
        
        if (question.type === 'open_ended') {
            q.answers = question.choices.map(choice => choice.answer);
        }
        
        return q;
    });
};

// Handle quiz ID input changes
const handleInputChange = () => {
    const quizID = inputBox.value.trim();
    
    if (!quizID) {
        inputBox.style.backgroundColor = 'white';
        config.info.numQuestions = 0;
        return;
    }
    
    fetch(`https://kahoot.it/rest/kahoots/${quizID}`)
        .then(response => {
            if (!response.ok) throw new Error('Invalid quiz ID');
            return response.json();
        })
        .then(data => {
            inputBox.style.backgroundColor = config.theme.correct;
            config.questions = parseQuestions(data.questions);
            config.info.numQuestions = config.questions.length;
            questionsLabel.textContent = `Question 0 / ${config.info.numQuestions}`;
        })
        .catch(() => {
            inputBox.style.backgroundColor = config.theme.incorrect;
            config.info.numQuestions = 0;
            questionsLabel.textContent = 'Question 0 / 0';
        });
};

inputBox.addEventListener('input', handleInputChange);

// Add UI to document
document.body.appendChild(uiElement);

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
    if (!isDragging) return;
    
    const x = Math.max(0, Math.min(window.innerWidth - uiElement.offsetWidth, e.clientX - offsetX));
    const y = Math.max(0, Math.min(window.innerHeight - uiElement.offsetHeight, e.clientY - offsetY));
    
    Object.assign(uiElement.style, {
        left: `${x}px`,
        top: `${y}px`
    });
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    uiElement.style.cursor = '';
});

// Answer highlighting functions
const resetAnswerColors = () => {
    document.querySelectorAll('button[data-functional-selector^="answer-"], button[data-functional-selector^="multi-select-button-"]')
        .forEach(button => {
            button.style.removeProperty('background-color');
            button.style.removeProperty('transition');
        });
};

const highlightAnswers = (question) => {
    if (!question) return;
    
    // Reset colors first
    resetAnswerColors();
    
    // Highlight correct answers
    question.answers?.forEach(answer => {
        const btn = findElementByAttribute('data-functional-selector', `answer-${answer}`, 'button') || 
                     findElementByAttribute('data-functional-selector', `multi-select-button-${answer}`, 'button');
        if (btn) {
            btn.style.setProperty('background-color', config.theme.correct, 'important');
            btn.style.setProperty('transition', 'background-color 0.3s', 'important');
        }
    });
    
    // Highlight incorrect answers
    question.incorrectAnswers?.forEach(answer => {
        const btn = findElementByAttribute('data-functional-selector', `answer-${answer}`, 'button') || 
                    findElementByAttribute('data-functional-selector', `multi-select-button-${answer}`, 'button');
        if (btn) {
            btn.style.setProperty('background-color', config.theme.incorrect, 'important');
            btn.style.setProperty('transition', 'background-color 0.3s', 'important');
        }
    });
};

// Rainbow effect functions
const startRainbowEffect = () => {
    stopRainbowEffect();
    
    const colors = [
        '#FF0000', '#FF7F00', '#FFFF00', 
        '#00FF00', '#0000FF', '#4B0082', 
        '#9400D3', '#FF1493', '#FF69B4'
    ];
    
    const applyRandomColors = () => {
        document.querySelectorAll('button[data-functional-selector^="answer-"], button[data-functional-selector^="multi-select-button-"]')
            .forEach(button => {
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                button.style.setProperty('background-color', randomColor, 'important');
                button.style.setProperty('transition', `background-color ${config.rainbowSpeed/1000}s`, 'important');
            });
    };
    
    applyRandomColors();
    config.rainbowInterval = setInterval(applyRandomColors, config.rainbowSpeed);
};

const stopRainbowEffect = () => {
    if (config.rainbowInterval) {
        clearInterval(config.rainbowInterval);
        config.rainbowInterval = null;
    }
    resetAnswerColors();
};

// Answering functions
const answerQuestion = (question, time) => {
    if (!question) return;
    
    config.Answered_PPT = config.PPT;
    const delay = question.type === 'multiple_select_quiz' ? 60 : 0;
    
    setTimeout(() => {
        if (question.type === 'quiz' && question.answers?.[0] !== undefined) {
            const key = (question.answers[0] + 1).toString();
            window.dispatchEvent(new KeyboardEvent('keydown', { key }));
        }
        
        if (question.type === 'multiple_select_quiz' && question.answers) {
            question.answers.forEach(answer => {
                const key = (answer + 1).toString();
                window.dispatchEvent(new KeyboardEvent('keydown', { key }));
            });
            
            const submitBtn = findElementByAttribute('data-functional-selector', 'multi-select-submit-button', 'button');
            if (submitBtn) submitBtn.click();
        }
    }, time - delay);
};

// Question start handler
const onQuestionStart = () => {
    const question = config.questions[config.info.questionNum];
    if (!question) return;
    
    if (config.showAnswers || config.isAltSPressed) {
        highlightAnswers(question);
    }
    
    if (config.autoAnswer) {
        const answerTime = (question.time - question.time / (500 / (config.PPT - 500))) - config.inputLag;
        answerQuestion(question, answerTime);
    }
};

// Keybind handlers
document.addEventListener('keydown', function(e) {
    // SHIFT - Toggle UI visibility
    if (e.key === 'Shift' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        config.isUIVisible = !config.isUIVisible;
        uiElement.style.display = config.isUIVisible ? 'block' : 'none';
        return;
    }
    
    if (!config.isUIVisible) return;
    
    // ALT+W - Answer correctly
    if (e.key.toLowerCase() === 'w' && e.altKey && config.info.questionNum !== -1) {
        e.preventDefault();
        const question = config.questions[config.info.questionNum];
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
                const submitBtn = findElementByAttribute('data-functional-selector', 'multi-select-submit-button', 'button');
                if (submitBtn) submitBtn.click();
            }, 50);
        }
    }
    
    // ALT+S - Show answers while held
    if (e.key.toLowerCase() === 's' && e.altKey && config.info.questionNum !== -1) {
        e.preventDefault();
        config.isAltSPressed = true;
        highlightAnswers(config.questions[config.info.questionNum]);
    }
    
    // ALT+R - Rainbow mode while held
    if (e.key.toLowerCase() === 'r' && e.altKey && !config.isAltRPressed) {
        e.preventDefault();
        config.isAltRPressed = true;
        startRainbowEffect();
    }
});

document.addEventListener('keyup', function(e) {
    // ALT+S released
    if (e.key.toLowerCase() === 's' && config.isAltSPressed) {
        config.isAltSPressed = false;
        if (!config.showAnswers) {
            resetAnswerColors();
        }
    }
    
    // ALT+R released
    if (e.key.toLowerCase() === 'r' && config.isAltRPressed) {
        config.isAltRPressed = false;
        stopRainbowEffect();
    }
});

// Main interval for tracking questions
setInterval(() => {
    // Update question number
    const questionCounter = findElementByAttribute('data-functional-selector', 'question-index-counter', 'div');
    if (questionCounter) {
        config.info.questionNum = parseInt(questionCounter.textContent) - 1;
    }
    
    // Detect new question
    if (findElementByAttribute('data-functional-selector', 'answer-0', 'button') && 
        config.info.lastAnsweredQuestion !== config.info.questionNum) {
        config.info.lastAnsweredQuestion = config.info.questionNum;
        onQuestionStart();
    }
    
    // Update input lag for auto-answer
    if (config.autoAnswer && config.info.ILSetQuestion !== config.info.questionNum) {
        const incrementElement = findElementByAttribute('data-functional-selector', 'score-increment', 'span');
        if (incrementElement) {
            const incrementText = incrementElement.textContent;
            const increment = parseInt(incrementText.split(' ')[1]);
            
            if (!isNaN(increment) && increment !== 0) {
                config.info.ILSetQuestion = config.info.questionNum;
                const adjustment = (config.PPT - increment) * 15;
                
                if (adjustment < 0 && config.inputLag + adjustment < 0) {
                    config.inputLag += (config.PPT - increment / 2) * 15;
                } else {
                    config.inputLag += adjustment;
                }
                
                config.inputLag = Math.max(0, Math.round(config.inputLag));
                inputLagLabel.textContent = `Input lag: ${config.inputLag} ms`;
            }
        }
    }
    
    // Update UI labels
    questionsLabel.textContent = `Question ${config.info.questionNum + 1} / ${config.info.numQuestions}`;
}, 50);
