// ==UserScript==
// @name         KaHack!
// @version      1.0.35
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
    var Version = '1.0.35';
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
        minimize: '#607D8B',
        hoverGlow: '0 0 15px rgba(102, 175, 233, 0.8)'
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
    uiElement.className = 'kahack-ui';
    Object.assign(uiElement.style, {
        position: 'fixed',
        top: '20px',
        left: '20px',
        width: '350px',
        backgroundColor: colors.primary,
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        zIndex: '9999',
        overflow: 'hidden',
        border: '1px solid ' + colors.accent,
        transition: 'box-shadow 0.3s ease'
    });

    // Add hover glow effect
    uiElement.addEventListener('mouseenter', function() {
        this.style.boxShadow = colors.hoverGlow + ', 0 4px 20px rgba(0,0,0,0.3)';
    });
    uiElement.addEventListener('mouseleave', function() {
        this.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    });

    // Create header
    var handle = document.createElement('div');
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
        borderBottom: '1px solid ' + colors.accent
    });

    var title = document.createElement('div');
    title.textContent = 'KaHack!';
    title.style.fontWeight = 'bold';
    title.style.fontSize = '16px';

    var buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '5px';

    var minimizeButton = document.createElement('div');
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

    var closeButton = document.createElement('div');
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
    var content = document.createElement('div');
    content.className = 'kahack-content';
    Object.assign(content.style, {
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    });

    // Create section function
    function createSection(titleText) {
        var section = document.createElement('div');
        Object.assign(section.style, {
            backgroundColor: colors.secondary,
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid ' + colors.accent
        });

        var header = document.createElement('h3');
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
    var quizIdSection = createSection('QUIZ ID');
    var inputBox = document.createElement('input');
    Object.assign(inputBox.style, {
        width: '100%',
        padding: '8px',
        borderRadius: '6px',
        border: '1px solid #555',
        backgroundColor: '#fff',
        color: '#000',
        fontSize: '14px',
        transition: 'background-color 0.3s ease'
    });
    inputBox.placeholder = 'Enter Quiz ID...';
    quizIdSection.body.appendChild(inputBox);
    content.appendChild(quizIdSection.section);

    // Points Section
    var pointsSection = createSection('POINTS PER QUESTION');
    var pointsSliderContainer = document.createElement('div');
    Object.assign(pointsSliderContainer.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    });

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

    pointsSliderContainer.appendChild(pointsSlider);
    pointsSliderContainer.appendChild(pointsLabel);
    pointsSection.body.appendChild(pointsSliderContainer);
    content.appendChild(pointsSection.section);

    // Answering Section
    var answeringSection = createSection('ANSWERING');

    function createToggle(labelText, checked, onChange) {
        var container = document.createElement('div');
        Object.assign(container.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            margin: '8px 0'
        });

        var label = document.createElement('span');
        label.textContent = labelText;
        label.style.color = colors.text;
        label.style.fontSize = '14px';

        var toggle = document.createElement('label');
        Object.assign(toggle.style, {
            position: 'relative',
            display: 'inline-block',
            width: '50px',
            height: '24px'
        });

        var input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = checked;
        Object.assign(input.style, {
            opacity: '0',
            width: '0',
            height: '0'
        });

        var slider = document.createElement('span');
        Object.assign(slider.style, {
            position: 'absolute',
            cursor: 'pointer',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: checked ? colors.correct : colors.incorrect,
            transition: '.4s',
            borderRadius: '24px'
        });

        var sliderBefore = document.createElement('span');
        Object.assign(sliderBefore.style, {
            position: 'absolute',
            content: '""',
            height: '16px',
            width: '16px',
            left: checked ? '26px' : '4px',
            bottom: '4px',
            backgroundColor: '#fff',
            transition: '.4s',
            borderRadius: '50%'
        });

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
    content.appendChild(answeringSection.section);

    // Rainbow Section
    var rainbowSection = createSection('RAINBOW SPEED');
    var rainbowContainer = document.createElement('div');
    Object.assign(rainbowContainer.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    });

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
    rainbowSection.body.appendChild(rainbowContainer);
    content.appendChild(rainbowSection.section);

    // Info Section
    var infoSection = createSection('INFO');
    var questionsLabel = document.createElement('div');
    questionsLabel.textContent = 'Question: 0/0';
    questionsLabel.style.color = colors.text;
    infoSection.body.appendChild(questionsLabel);

    var inputLagLabel = document.createElement('div');
    inputLagLabel.textContent = 'Input lag: 100ms';
    inputLagLabel.style.color = colors.text;
    infoSection.body.appendChild(inputLagLabel);

    var versionLabel = document.createElement('div');
    versionLabel.textContent = 'Version: ' + Version;
    versionLabel.style.color = colors.text;
    infoSection.body.appendChild(versionLabel);
    content.appendChild(infoSection.section);

    // Add UI to document
    document.body.appendChild(uiElement);
    uiElement.appendChild(content);

    // Quiz ID validation
    function handleInputChange() {
        var quizID = inputBox.value.trim();
        
        if (quizID === "") {
            inputBox.style.backgroundColor = 'white';
            info.numQuestions = 0;
            questionsLabel.textContent = 'Question: 0/0';
            return;
        }
        
        fetch('https://kahoot.it/rest/kahoots/' + quizID)
            .then(function(response) {
                if (!response.ok) throw new Error('Invalid');
                return response.json();
            })
            .then(function(data) {
                inputBox.style.backgroundColor = colors.correct;
                questions = parseQuestions(data.questions);
                info.numQuestions = questions.length;
                questionsLabel.textContent = 'Question: 0/' + info.numQuestions;
            })
            .catch(function() {
                inputBox.style.backgroundColor = colors.incorrect;
                info.numQuestions = 0;
                questionsLabel.textContent = 'Question: 0/0';
            });
    }

    inputBox.addEventListener('input', handleInputChange);

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

    // Answer highlighting
    function highlightAnswers(question) {
        if (!question) return;
        
        var answerButtons = document.querySelectorAll(
            'button[data-functional-selector^="answer-"], button[data-functional-selector^="multi-select-button-"]'
        );
        
        // Reset all buttons first
        answerButtons.forEach(function(button) {
            button.style.removeProperty('background-color');
        });
        
        // Highlight correct answers
        if (question.answers) {
            question.answers.forEach(function(answer) {
                var btn = FindByAttributeValue("data-functional-selector", "answer-" + answer, "button") || 
                          FindByAttributeValue("data-functional-selector", "multi-select-button-" + answer, "button");
                if (btn) {
                    btn.style.setProperty('background-color', colors.correct, 'important');
                }
            });
        }
        
        // Highlight incorrect answers
        if (question.incorrectAnswers) {
            question.incorrectAnswers.forEach(function(answer) {
                var btn = FindByAttributeValue("data-functional-selector", "answer-" + answer, "button") || 
                          FindByAttributeValue("data-functional-selector", "multi-select-button-" + answer, "button");
                if (btn) {
                    btn.style.setProperty('background-color', colors.incorrect, 'important');
                }
            });
        }
    }

    // Question answering
    function answer(question, time) {
        Answered_PPT = PPT;
        var delay = question.type === 'multiple_select_quiz' ? 60 : 0;
        
        setTimeout(function() {
            if (question.type === 'quiz') {
                var key = (question.answers[0] + 1).toString();
                window.dispatchEvent(new KeyboardEvent('keydown', { key: key }));
            } 
            else if (question.type === 'multiple_select_quiz') {
                question.answers.forEach(function(answer) {
                    var key = (answer + 1).toString();
                    window.dispatchEvent(new KeyboardEvent('keydown', { key: key }));
                });
                
                setTimeout(function() {
                    var submitBtn = FindByAttributeValue("data-functional-selector", "multi-select-submit-button", "button");
                    if (submitBtn) submitBtn.click();
                }, 0);
            }
        }, time - delay);
    }

    function onQuestionStart() {
        var question = questions[info.questionNum];
        if (!question) return;
        
        if (showAnswers || isAltSPressed) {
            highlightAnswers(question);
        }
        
        if (autoAnswer) {
            var answerTime = (question.time - question.time / (500 / (PPT - 500))) - inputLag;
            answer(question, answerTime);
        }
    }

    // Parse questions
    function parseQuestions(questionsJson) {
        var parsed = [];
        questionsJson.forEach(function(question) {
            var q = { type: question.type, time: question.time };
            
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
            
            if (question.type === 'open_ended') {
                q.answers = question.choices.map(function(choice) {
                    return choice.answer;
                });
            }
            
            parsed.push(q);
        });
        return parsed;
    }

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
        PPT = +this.value;
        pointsLabel.textContent = PPT;
    });

    rainbowSlider.addEventListener('input', function() {
        rainbowSpeed = +this.value;
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
            var x = Math.max(0, Math.min(window.innerWidth - uiElement.offsetWidth, e.clientX - offsetX));
            var y = Math.max(0, Math.min(window.innerHeight - uiElement.offsetHeight, e.clientY - offsetY));
            uiElement.style.left = x + 'px';
            uiElement.style.top = y + 'px';
        }
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
    });

    // Keybind handlers
    document.addEventListener('keydown', function(e) {
        // SHIFT - Toggle UI
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
            var question = questions[info.questionNum];
            if (!question || !question.answers || question.answers.length === 0) return;
            
            if (question.type === 'quiz') {
                var key = (question.answers[0] + 1).toString();
                window.dispatchEvent(new KeyboardEvent('keydown', { key: key }));
            } 
            else if (question.type === 'multiple_select_quiz') {
                question.answers.forEach(function(answer) {
                    var key = (answer + 1).toString();
                    window.dispatchEvent(new KeyboardEvent('keydown', { key: key }));
                });
                
                setTimeout(function() {
                    var submitBtn = FindByAttributeValue("data-functional-selector", "multi-select-submit-button", "button");
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
    setInterval(function() {
        // Update question number
        var textElement = FindByAttributeValue("data-functional-selector", "question-index-counter", "div");
        if (textElement) {
            info.questionNum = parseInt(textElement.textContent) - 1;
            questionsLabel.textContent = 'Question: ' + (info.questionNum + 1) + '/' + info.numQuestions;
        }
        
        // Detect new question
        if (FindByAttributeValue("data-functional-selector", "answer-0", "button") && 
            info.lastAnsweredQuestion !== info.questionNum) {
            info.lastAnsweredQuestion = info.questionNum;
            onQuestionStart();
        }
        
        // Update input lag for auto-answer
        if (autoAnswer && info.ILSetQuestion !== info.questionNum) {
            var incrementElement = FindByAttributeValue("data-functional-selector", "score-increment", "span");
            if (incrementElement) {
                info.ILSetQuestion = info.questionNum;
                var incrementText = incrementElement.textContent;
                var increment = parseInt(incrementText.split(" ")[1]);
                
                if (!isNaN(increment) && increment !== 0) {
                    var ppt = Answered_PPT > 987 ? 1000 : Answered_PPT;
                    var adjustment = (ppt - increment) * 15;
                    
                    if (inputLag + adjustment < 0) {
                        adjustment = (ppt - increment / 2) * 15;
                    }
                    
                    inputLag = Math.max(0, Math.round(inputLag + adjustment));
                    inputLagLabel.textContent = 'Input lag: ' + inputLag + 'ms';
                }
            }
        }
    }, 50);

    // Add CSS styles
    var style = document.createElement('style');
    style.textContent = `
        .kahack-ui {
            font-family: 'Montserrat', sans-serif;
        }
        input[type="range"] {
            -webkit-appearance: none;
            width: 100%;
            height: 6px;
            background: #555;
            border-radius: 3px;
            outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 16px;
            height: 16px;
            background: #333;
            border-radius: 50%;
            cursor: pointer;
        }
        input[type="text"] {
            transition: background-color 0.3s ease, box-shadow 0.3s ease;
        }
        input[type="text"]:focus {
            outline: none;
            box-shadow: 0 0 5px rgba(102, 175, 233, 0.5);
        }
    `;
    document.head.appendChild(style);
})();
