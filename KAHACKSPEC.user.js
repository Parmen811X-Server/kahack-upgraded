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

(function() {
    'use strict';

    // Configuration
    var Version = '1.0.34';
    var questions = [];
    var info = {
        numQuestions: 0,
        questionNum: -1,
        lastAnsweredQuestion: -1,
        defaultIL: true,
        ILSetQuestion: -1
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

    // Colors
    var colors = {
        primary: '#1a1a2e',
        secondary: '#16213e',
        accent: '#0f3460',
        text: '#e6e6e6',
        correct: '#4CAF50',
        incorrect: '#F44336',
        close: '#F44336',
        minimize: '#607D8B'
    };

    // Helper function
    function FindByAttributeValue(attribute, value, element_type) {
        element_type = element_type || "*";
        var All = document.getElementsByTagName(element_type);
        for (var i = 0; i < All.length; i++) {
            if (All[i].getAttribute(attribute) == value) { return All[i]; }
        }
        return null;
    }

    // Create UI
    var uiElement = document.createElement('div');
    uiElement.className = 'floating-ui';
    uiElement.style.position = 'fixed';
    uiElement.style.top = '20px';
    uiElement.style.left = '20px';
    uiElement.style.width = '350px';
    uiElement.style.backgroundColor = colors.primary;
    uiElement.style.borderRadius = '10px';
    uiElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    uiElement.style.zIndex = '9999';
    uiElement.style.overflow = 'hidden';
    uiElement.style.border = '1px solid ' + colors.accent;

    // Create header
    var handle = document.createElement('div');
    handle.className = 'handle';
    handle.style.padding = '10px';
    handle.style.backgroundColor = colors.secondary;
    handle.style.color = colors.text;
    handle.style.cursor = 'grab';
    handle.style.display = 'flex';
    handle.style.justifyContent = 'space-between';
    handle.style.alignItems = 'center';

    var title = document.createElement('div');
    title.textContent = 'KaHack!';
    title.style.fontWeight = 'bold';
    title.style.fontSize = '16px';

    var buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '5px';

    var minimizeButton = document.createElement('div');
    minimizeButton.textContent = '─';
    minimizeButton.style.width = '24px';
    minimizeButton.style.height = '24px';
    minimizeButton.style.backgroundColor = colors.minimize;
    minimizeButton.style.color = colors.text;
    minimizeButton.style.display = 'flex';
    minimizeButton.style.justifyContent = 'center';
    minimizeButton.style.alignItems = 'center';
    minimizeButton.style.borderRadius = '4px';
    minimizeButton.style.cursor = 'pointer';

    var closeButton = document.createElement('div');
    closeButton.textContent = '✕';
    closeButton.style.width = '24px';
    closeButton.style.height = '24px';
    closeButton.style.backgroundColor = colors.close;
    closeButton.style.color = colors.text;
    closeButton.style.display = 'flex';
    closeButton.style.justifyContent = 'center';
    closeButton.style.alignItems = 'center';
    closeButton.style.borderRadius = '4px';
    closeButton.style.cursor = 'pointer';

    buttonContainer.appendChild(minimizeButton);
    buttonContainer.appendChild(closeButton);
    handle.appendChild(title);
    handle.appendChild(buttonContainer);
    uiElement.appendChild(handle);

    // Create content container
    var content = document.createElement('div');
    content.style.padding = '15px';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.gap = '15px';
    uiElement.appendChild(content);

    // Create sections
    function createSection(titleText) {
        var section = document.createElement('div');
        section.style.backgroundColor = colors.secondary;
        section.style.borderRadius = '8px';
        section.style.padding = '12px';
        section.style.border = '1px solid ' + colors.accent;

        var header = document.createElement('h3');
        header.textContent = titleText;
        header.style.margin = '0 0 10px 0';
        header.style.color = colors.text;
        header.style.fontSize = '14px';

        section.appendChild(header);
        return section;
    }

    // Quiz ID Section
    var quizIdSection = createSection('QUIZ ID');
    var inputBox = document.createElement('input');
    inputBox.type = 'text';
    inputBox.style.width = '100%';
    inputBox.style.padding = '8px';
    inputBox.style.borderRadius = '4px';
    inputBox.style.border = '1px solid #555';
    inputBox.placeholder = 'Enter Quiz ID...';
    quizIdSection.appendChild(inputBox);
    content.appendChild(quizIdSection);

    // Points Section
    var pointsSection = createSection('POINTS PER QUESTION');
    var pointsContainer = document.createElement('div');
    pointsContainer.style.display = 'flex';
    pointsContainer.style.alignItems = 'center';
    pointsContainer.style.gap = '10px';

    var pointsSlider = document.createElement('input');
    pointsSlider.type = 'range';
    pointsSlider.min = '500';
    pointsSlider.max = '1000';
    pointsSlider.value = '950';
    pointsSlider.style.flex = '1';

    var pointsLabel = document.createElement('span');
    pointsLabel.textContent = '950';
    pointsLabel.style.color = colors.text;
    pointsLabel.style.minWidth = '40px';
    pointsLabel.style.textAlign = 'center';

    pointsContainer.appendChild(pointsSlider);
    pointsContainer.appendChild(pointsLabel);
    pointsSection.appendChild(pointsContainer);
    content.appendChild(pointsSection);

    // Answering Section
    var answeringSection = createSection('ANSWERING');

    function createToggle(labelText, checked, onChange) {
        var container = document.createElement('div');
        container.style.display = 'flex';
        container.style.justifyContent = 'space-between';
        container.style.alignItems = 'center';
        container.style.margin = '8px 0';

        var label = document.createElement('span');
        label.textContent = labelText;
        label.style.color = colors.text;

        var toggle = document.createElement('label');
        toggle.style.position = 'relative';
        toggle.style.display = 'inline-block';
        toggle.style.width = '50px';
        toggle.style.height = '24px';

        var input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = checked;
        input.style.opacity = '0';
        input.style.width = '0';
        input.style.height = '0';

        var slider = document.createElement('span');
        slider.style.position = 'absolute';
        slider.style.cursor = 'pointer';
        slider.style.top = '0';
        slider.style.left = '0';
        slider.style.right = '0';
        slider.style.bottom = '0';
        slider.style.backgroundColor = checked ? colors.correct : colors.incorrect;
        slider.style.transition = '.4s';
        slider.style.borderRadius = '24px';

        var sliderBefore = document.createElement('span');
        sliderBefore.style.position = 'absolute';
        sliderBefore.style.content = '""';
        sliderBefore.style.height = '16px';
        sliderBefore.style.width = '16px';
        sliderBefore.style.left = checked ? '26px' : '4px';
        sliderBefore.style.bottom = '4px';
        sliderBefore.style.backgroundColor = '#fff';
        sliderBefore.style.transition = '.4s';
        sliderBefore.style.borderRadius = '50%';

        input.addEventListener('change', function() {
            onChange(this.checked);
            slider.style.backgroundColor = this.checked ? colors.correct : colors.incorrect;
            sliderBefore.style.left = this.checked ? '26px' : '4px';
        });

        toggle.appendChild(input);
        toggle.appendChild(slider);
        slider.appendChild(sliderBefore);
        container.appendChild(label);
        container.appendChild(toggle);

        return container;
    }

    answeringSection.appendChild(createToggle('Auto Answer', autoAnswer, function(checked) {
        autoAnswer = checked;
        info.ILSetQuestion = info.questionNum;
    }));

    answeringSection.appendChild(createToggle('Show Answers', showAnswers, function(checked) {
        showAnswers = checked;
        if (!showAnswers && !isAltSPressed) {
            resetAnswerColors();
        }
    }));
    content.appendChild(answeringSection);

    // Rainbow Section
    var rainbowSection = createSection('RAINBOW SPEED');
    var rainbowContainer = document.createElement('div');
    rainbowContainer.style.display = 'flex';
    rainbowContainer.style.alignItems = 'center';
    rainbowContainer.style.gap = '10px';

    var rainbowSlider = document.createElement('input');
    rainbowSlider.type = 'range';
    rainbowSlider.min = '50';
    rainbowSlider.max = '1000';
    rainbowSlider.value = '300';
    rainbowSlider.style.flex = '1';

    var rainbowLabel = document.createElement('span');
    rainbowLabel.textContent = '300ms';
    rainbowLabel.style.color = colors.text;
    rainbowLabel.style.minWidth = '50px';
    rainbowLabel.style.textAlign = 'center';

    rainbowContainer.appendChild(rainbowSlider);
    rainbowContainer.appendChild(rainbowLabel);
    rainbowSection.appendChild(rainbowContainer);
    content.appendChild(rainbowSection);

    // Info Section
    var infoSection = createSection('INFO');
    var questionsLabel = document.createElement('div');
    questionsLabel.textContent = 'Question: 0/0';
    questionsLabel.style.color = colors.text;
    infoSection.appendChild(questionsLabel);

    var inputLagLabel = document.createElement('div');
    inputLagLabel.textContent = 'Input lag: 100ms';
    inputLagLabel.style.color = colors.text;
    infoSection.appendChild(inputLagLabel);

    var versionLabel = document.createElement('div');
    versionLabel.textContent = 'Version: ' + Version;
    versionLabel.style.color = colors.text;
    infoSection.appendChild(versionLabel);
    content.appendChild(infoSection);

    // Add UI to document
    document.body.appendChild(uiElement);

    // Rainbow effect functions
    function startRainbowEffect() {
        if (rainbowInterval) {
            clearInterval(rainbowInterval);
            rainbowInterval = null;
        }
        
        var rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
        var answerButtons = document.querySelectorAll(
            'button[data-functional-selector^="answer-"], button[data-functional-selector^="multi-select-button-"]'
        );
        
        function applyColors() {
            answerButtons.forEach(function(button) {
                var randomColor = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
                button.style.setProperty('background-color', randomColor, 'important');
                button.style.setProperty('transition', 'background-color ' + (rainbowSpeed/1000) + 's ease', 'important');
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
        var answerButtons = document.querySelectorAll(
            'button[data-functional-selector^="answer-"], button[data-functional-selector^="multi-select-button-"]'
        );
        answerButtons.forEach(function(button) {
            button.style.removeProperty('background-color');
            button.style.removeProperty('transition');
        });
    }

    // Rest of your functions...
    // [Include all other functions from your original script here]
    // parseQuestions, handleInputChange, highlightAnswers, answer, onQuestionStart, etc.

    // Event listeners
    closeButton.addEventListener('click', function() {
        document.body.removeChild(uiElement);
        autoAnswer = false;
        showAnswers = false;
        stopRainbowEffect();
    });

    var isMinimized = false;
    minimizeButton.addEventListener('click', function() {
        isMinimized = !isMinimized;
        content.style.display = isMinimized ? 'none' : 'flex';
    });

    pointsSlider.addEventListener('input', function() {
        PPT = +pointsSlider.value;
        pointsLabel.textContent = PPT;
    });

    rainbowSlider.addEventListener('input', function() {
        rainbowSpeed = +rainbowSlider.value;
        rainbowLabel.textContent = rainbowSpeed + 'ms';
        if (isAltRPressed) {
            startRainbowEffect();
        }
    });

    // Dragging functionality
    var isDragging = false;
    var offsetX, offsetY;

    handle.addEventListener('mousedown', function(e) {
        isDragging = true;
        offsetX = e.clientX - uiElement.getBoundingClientRect().left;
        offsetY = e.clientY - uiElement.getBoundingClientRect().top;
    });

    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            var x = e.clientX - offsetX;
            var y = e.clientY - offsetY;
            uiElement.style.left = x + 'px';
            uiElement.style.top = y + 'px';
        }
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
    });

    // Keybind handlers
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Shift' && !e.altKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            isUIVisible = !isUIVisible;
            uiElement.style.display = isUIVisible ? 'block' : 'none';
            return;
        }
        
        if (!isUIVisible) return;
        
        if (e.key.toLowerCase() === 'w' && e.altKey && info.questionNum !== -1) {
            e.preventDefault();
            var question = questions[info.questionNum];
            if (!question || !question.answers || question.answers.length === 0) return;
            
            if (question.type === 'quiz') {
                var key = (question.answers[0] + 1).toString();
                window.dispatchEvent(new KeyboardEvent('keydown', { key: key }));
            } else if (question.type === 'multiple_select_quiz') {
                question.answers.forEach(function(answer) {
                    var key = (answer + 1).toString();
                    window.dispatchEvent(new KeyboardEvent('keydown', { key: key }));
                });
                setTimeout(function() {
                    var submitBtn = FindByAttributeValue("data-functional-selector", 'multi-select-submit-button', "button");
                    if (submitBtn) submitBtn.click();
                }, 50);
            }
        }
        
        if (e.key.toLowerCase() === 's' && e.altKey && info.questionNum !== -1) {
            e.preventDefault();
            isAltSPressed = true;
            highlightAnswers(questions[info.questionNum]);
        }
        
        if (e.key.toLowerCase() === 'r' && e.altKey && !isAltRPressed) {
            e.preventDefault();
            isAltRPressed = true;
            startRainbowEffect();
        }
    });

    document.addEventListener('keyup', function(e) {
        if (e.key.toLowerCase() === 's' && isAltSPressed) {
            isAltSPressed = false;
            if (!showAnswers) {
                resetAnswerColors();
            }
        }
        
        if (e.key.toLowerCase() === 'r' && isAltRPressed) {
            isAltRPressed = false;
            stopRainbowEffect();
        }
    });

    // Main interval
    setInterval(function() {
        var textElement = FindByAttributeValue("data-functional-selector", "question-index-counter", "div");
        if (textElement) {
            info.questionNum = +textElement.textContent - 1;
            questionsLabel.textContent = 'Question: ' + (info.questionNum + 1) + '/' + info.numQuestions;
        }
        
        if (FindByAttributeValue("data-functional-selector", 'answer-0', "button") && info.lastAnsweredQuestion != info.questionNum) {
            info.lastAnsweredQuestion = info.questionNum;
            onQuestionStart();
        }
        
        if (autoAnswer && info.ILSetQuestion != info.questionNum) {
            var incrementElement = FindByAttributeValue("data-functional-selector", "score-increment", "span");
            if (incrementElement) {
                info.ILSetQuestion = info.questionNum;
                var increment = +incrementElement.textContent.split(" ")[1];
                if (increment != 0) {
                    inputLag += (PPT - increment) * 15;
                    if (inputLag < 0) {
                        inputLag -= (PPT - increment) * 15;
                        inputLag += (PPT - increment / 2) * 15;
                    }
                    inputLag = Math.round(inputLag);
                    inputLagLabel.textContent = 'Input lag: ' + inputLag + 'ms';
                }
            }
        }
    }, 50);

    // Add CSS styles
    var style = document.createElement('style');
    style.textContent = `
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
            background: #333;
            border-radius: 50%;
            cursor: pointer;
        }
        .handle:hover {
            background-color: ${colors.accent} !important;
        }
    `;
    document.head.appendChild(style);
})();
