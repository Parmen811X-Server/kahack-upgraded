// ==UserScript==
// @name         KaHack! Smooth Performance
// @version      1.5.0
// @namespace    https://github.com/jokeri2222
// @description  Optimized Kahoot hack with lightweight effects
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
    const Version = '1.5.0';
    let questions = [];
    const info = {
        numQuestions: 0,
        questionNum: -1,
        lastAnsweredQuestion: -1,
        defaultIL: true,
        ILSetQuestion: -1
    };
    let PPT = 950;
    let Answered_PPT = 950;
    let autoAnswer = false;
    let showAnswers = false;
    let inputLag = 100;
    let isAltSPressed = false;
    let isAltHPressed = false;
    let isAltRPressed = false;
    let rainbowInterval = null;
    let rainbowSpeed = 300;

    // Colors with simplified neon
    const colors = {
        primary: '#0d0d1a',
        secondary: '#12122b',
        accent: '#1a1a4a',
        text: '#e6e6ff',
        correct: '#00ff88',
        incorrect: '#ff3860',
        close: '#ff3860',
        minimize: '#7f7fff',
        hoverGlow: '0 0 8px rgba(100, 220, 255, 0.5)',
        rainbow: ['#ff0080', '#ff00ff', '#8000ff', '#0033ff', '#00ffff', '#00ff80', '#80ff00'],
        particleColors: ['#00ffff', '#ff00ff', '#ffff00']
    };

    // Helper function
    function FindByAttributeValue(attribute, value, element_type) {
        element_type = element_type || "*";
        const All = document.getElementsByTagName(element_type);
        for (let i = 0; i < All.length; i++) {
            if (All[i].getAttribute(attribute) === value) return All[i];
        }
        return null;
    }

    // Lightweight particle effect
    function createParticles(element, count = 5) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const size = Math.random() * 4 + 2;
            const color = colors.particleColors[Math.floor(Math.random() * colors.particleColors.length)];
            
            Object.assign(particle.style, {
                position: 'fixed',
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: '10000',
                left: `${centerX}px`,
                top: `${centerY}px`,
                opacity: '0.8',
                transform: 'translate(-50%, -50%)',
                willChange: 'transform, opacity'
            });
            
            document.body.appendChild(particle);
            
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 20 + 10;
            const duration = Math.random() * 600 + 400;
            
            const startTime = Date.now();
            
            function animate() {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / duration;
                
                if (progress >= 1) {
                    particle.remove();
                    return;
                }
                
                const x = centerX + Math.cos(angle) * distance * progress;
                const y = centerY + Math.sin(angle) * distance * progress;
                
                particle.style.transform = `translate(${x - centerX}px, ${y - centerY}px)`;
                particle.style.opacity = 0.8 * (1 - progress);
                
                requestAnimationFrame(animate);
            }
            
            requestAnimationFrame(animate);
        }
    }

    // Rainbow mode (optimized)
    function startRainbowEffect() {
        if (rainbowInterval) clearInterval(rainbowInterval);
        
        function applyRainbowColors() {
            const buttons = document.querySelectorAll(
                'button[data-functional-selector^="answer-"], button[data-functional-selector^="multi-select-button-"]'
            );
            
            buttons.forEach(button => {
                const randomColor = colors.rainbow[Math.floor(Math.random() * colors.rainbow.length)];
                button.style.cssText = `
                    background-color: ${randomColor} !important;
                    transition: background-color ${rainbowSpeed/1000}s ease !important;
                `;
            });
        }
        
        applyRainbowColors();
        rainbowInterval = setInterval(applyRainbowColors, rainbowSpeed);
    }

    function stopRainbowEffect() {
        if (rainbowInterval) {
            clearInterval(rainbowInterval);
            rainbowInterval = null;
        }
        resetAnswerColors();
    }

    function resetAnswerColors() {
        const buttons = document.querySelectorAll(
            'button[data-functional-selector^="answer-"], button[data-functional-selector^="multi-select-button-"]'
        );
        buttons.forEach(button => {
            button.style.removeProperty('background-color');
            button.style.removeProperty('transition');
        });
    }

    // Create optimized UI
    const uiElement = document.createElement('div');
    uiElement.className = 'kahack-ui';
    Object.assign(uiElement.style, {
        position: 'fixed',
        top: '20px',
        left: '20px',
        width: '350px',
        backgroundColor: colors.primary,
        borderRadius: '10px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
        zIndex: '9999',
        overflow: 'hidden',
        border: `1px solid ${colors.accent}`,
        transition: 'opacity 0.3s ease',
        willChange: 'transform'
    });

    // Create header
    const handle = document.createElement('div');
    handle.className = 'kahack-header';
    Object.assign(handle.style, {
        padding: '12px 15px',
        backgroundColor: colors.secondary,
        color: colors.text,
        cursor: 'move',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        userSelect: 'none',
        borderBottom: `1px solid ${colors.accent}`,
        WebkitUserSelect: 'none'
    });

    const title = document.createElement('div');
    title.textContent = 'Don´t get caught';
    title.style.fontWeight = 'bold';
    title.style.fontSize = '16px';

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '5px';

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
        fontSize: '14px',
        transition: 'transform 0.2s ease'
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
        cursor: 'pointer',
        transition: 'transform 0.2s ease'
    });

    // Button hover effects
    [minimizeButton, closeButton].forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.1)';
            createParticles(btn, 3);
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
        });
        btn.addEventListener('click', () => {
            createParticles(btn, 5);
        });
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
        gap: '15px',
        backgroundColor: colors.primary
    });

    // Create section function
    function createSection(titleText) {
        const section = document.createElement('div');
        Object.assign(section.style, {
            backgroundColor: colors.secondary,
            borderRadius: '8px',
            padding: '12px',
            border: `1px solid ${colors.accent}`,
            transition: 'transform 0.2s ease'
        });

        section.addEventListener('mouseenter', () => {
            section.style.transform = 'translateY(-2px)';
            createParticles(section, 2);
        });
        section.addEventListener('mouseleave', () => {
            section.style.transform = 'translateY(0)';
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
        fontSize: '14px',
        transition: 'box-shadow 0.3s ease'
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

    const pointsSlider = document.createElement('input');
    pointsSlider.type = 'range';
    pointsSlider.min = '500';
    pointsSlider.max = '1000';
    pointsSlider.value = '950';
    pointsSlider.style.flex = '1';

    const pointsLabel = document.createElement('span');
    pointsLabel.textContent = '950';
    pointsLabel.style.color = colors.text;
    pointsLabel.style.minWidth = '40px';
    pointsLabel.style.textAlign = 'center';

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
        label.style.color = colors.text;
        label.style.fontSize = '14px';

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
            backgroundColor: checked ? colors.correct : colors.incorrect,
            transition: '.4s',
            borderRadius: '24px'
        });

        const sliderBefore = document.createElement('span');
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
            createParticles(slider, 3);
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
    const rainbowSection = createSection('RAINBOW MODE');
    const rainbowContainer = document.createElement('div');
    Object.assign(rainbowContainer.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    });

    const rainbowSlider = document.createElement('input');
    rainbowSlider.type = 'range';
    rainbowSlider.min = '50';
    rainbowSlider.max = '1000';
    rainbowSlider.value = '300';
    rainbowSlider.style.flex = '1';

    const rainbowLabel = document.createElement('span');
    rainbowLabel.textContent = '300ms';
    rainbowLabel.style.color = colors.text;
    rainbowLabel.style.minWidth = '50px';
    rainbowLabel.style.textAlign = 'center';

    // Rainbow toggle button
    const rainbowButton = document.createElement('button');
    rainbowButton.textContent = 'Toggle Rainbow';
    Object.assign(rainbowButton.style, {
        width: '100%',
        padding: '8px',
        marginTop: '10px',
        backgroundColor: colors.accent,
        color: colors.text,
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'transform 0.2s ease'
    });
    
    rainbowButton.addEventListener('mouseenter', () => {
        rainbowButton.style.transform = 'scale(1.02)';
    });
    rainbowButton.addEventListener('mouseleave', () => {
        rainbowButton.style.transform = 'scale(1)';
    });
    rainbowButton.addEventListener('click', function() {
        if (rainbowInterval) {
            stopRainbowEffect();
            rainbowButton.textContent = 'Enable Rainbow';
        } else {
            startRainbowEffect();
            rainbowButton.textContent = 'Disable Rainbow';
        }
        createParticles(rainbowButton, 5);
    });
    
    rainbowContainer.appendChild(rainbowSlider);
    rainbowContainer.appendChild(rainbowLabel);
    rainbowSection.body.appendChild(rainbowContainer);
    rainbowSection.body.appendChild(rainbowButton);
    content.appendChild(rainbowSection.section);

    // Keybinds Section
    const keybindsSection = createSection('KEYBINDS');
    const keybindsList = document.createElement('div');
    keybindsList.style.color = colors.text;
    keybindsList.style.fontSize = '13px';
    keybindsList.style.lineHeight = '1.5';
    
    const keybinds = [
        ['ALT + H', 'Toggle UI visibility'],
        ['ALT + W', 'Answer correctly'],
        ['ALT + S', 'Show answers (while held)'],
        ['ALT + R', 'Rainbow mode (while held)'],
        ['Shift', 'Quick hide/show']
    ];
    
    keybinds.forEach(([key, desc]) => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        
        const keyElem = document.createElement('span');
        keyElem.textContent = key;
        keyElem.style.fontWeight = 'bold';
        
        const descElem = document.createElement('span');
        descElem.textContent = desc;
        
        item.appendChild(keyElem);
        item.appendChild(descElem);
        keybindsList.appendChild(item);
    });
    
    keybindsSection.body.appendChild(keybindsList);
    content.appendChild(keybindsSection.section);

    // Info Section
    const infoSection = createSection('INFO');
    const questionsLabel = document.createElement('div');
    questionsLabel.textContent = 'Question: 0/0';
    questionsLabel.style.color = colors.text;
    infoSection.body.appendChild(questionsLabel);

    const inputLagLabel = document.createElement('div');
    inputLagLabel.textContent = 'Input lag: 100ms';
    inputLagLabel.style.color = colors.text;
    infoSection.body.appendChild(inputLagLabel);

    const versionLabel = document.createElement('div');
    versionLabel.textContent = 'Version: ' + Version;
    versionLabel.style.color = colors.text;
    infoSection.body.appendChild(versionLabel);
    content.appendChild(infoSection.section);

    // Add UI to document
    document.body.appendChild(uiElement);
    uiElement.appendChild(content);

    // Optimized dragging functionality
    let isDragging = false;
    let offsetX, offsetY;
    let dragFrame;

    handle.addEventListener('mousedown', function(e) {
        isDragging = true;
        offsetX = e.clientX - uiElement.getBoundingClientRect().left;
        offsetY = e.clientY - uiElement.getBoundingClientRect().top;
        document.body.style.userSelect = 'none';
        cancelAnimationFrame(dragFrame);
    });

    function handleDrag(e) {
        if (!isDragging) return;
        
        dragFrame = requestAnimationFrame(() => {
            const x = Math.max(0, Math.min(window.innerWidth - uiElement.offsetWidth, e.clientX - offsetX));
            const y = Math.max(0, Math.min(window.innerHeight - uiElement.offsetHeight, e.clientY - offsetY));
            uiElement.style.left = x + 'px';
            uiElement.style.top = y + 'px';
        });
    }

    document.addEventListener('mousemove', handleDrag);

    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            document.body.style.userSelect = '';
        }
    });

    // Quiz ID validation
    function handleInputChange() {
        const quizID = inputBox.value.trim();
        
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
                inputBox.style.boxShadow = colors.hoverGlow;
                questions = parseQuestions(data.questions);
                info.numQuestions = questions.length;
                questionsLabel.textContent = 'Question: 0/' + info.numQuestions;
                createParticles(inputBox, 8);
            })
            .catch(function() {
                inputBox.style.backgroundColor = colors.incorrect;
                info.numQuestions = 0;
                questionsLabel.textContent = 'Question: 0/0';
            });
    }

    inputBox.addEventListener('input', handleInputChange);

    // Answer highlighting
    function highlightAnswers(question) {
        if (!question) return;
        
        const answerButtons = document.querySelectorAll(
            'button[data-functional-selector^="answer-"], button[data-functional-selector^="multi-select-button-"]'
        );
        
        // Reset all buttons first
        answerButtons.forEach(function(button) {
            button.style.removeProperty('background-color');
        });
        
        // Highlight correct answers
        if (question.answers) {
            question.answers.forEach(function(answer) {
                const btn = FindByAttributeValue("data-functional-selector", "answer-" + answer, "button") || 
                          FindByAttributeValue("data-functional-selector", "multi-select-button-" + answer, "button");
                if (btn) {
                    btn.style.setProperty('background-color', colors.correct, 'important');
                }
            });
        }
        
        // Highlight incorrect answers
        if (question.incorrectAnswers) {
            question.incorrectAnswers.forEach(function(answer) {
                const btn = FindByAttributeValue("data-functional-selector", "answer-" + answer, "button") || 
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
        const delay = question.type === 'multiple_select_quiz' ? 60 : 0;
        
        setTimeout(function() {
            if (question.type === 'quiz') {
                const key = (question.answers[0] + 1).toString();
                window.dispatchEvent(new KeyboardEvent('keydown', { key: key }));
            } 
            else if (question.type === 'multiple_select_quiz') {
                question.answers.forEach(function(answer) {
                    const key = (answer + 1).toString();
                    window.dispatchEvent(new KeyboardEvent('keydown', { key: key }));
                });
                
                setTimeout(function() {
                    const submitBtn = FindByAttributeValue("data-functional-selector", "multi-select-submit-button", "button");
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

    // Parse questions
    function parseQuestions(questionsJson) {
        const parsed = [];
        questionsJson.forEach(function(question) {
            const q = { type: question.type, time: question.time };
            
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

    let isMinimized = false;
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
        if (rainbowInterval) {
            startRainbowEffect(); // Restart with new speed
        }
    });

    // Keybind handlers
    document.addEventListener('keydown', function(e) {
        // ALT+H - Toggle full stealth mode
        if (e.key.toLowerCase() === 'h' && e.altKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            isAltHPressed = !isAltHPressed;
            uiElement.style.opacity = isAltHPressed ? '0' : '1';
            uiElement.style.pointerEvents = isAltHPressed ? 'none' : 'auto';
            createParticles(uiElement, 10);
        }
        
        // SHIFT - Quick hide/show
        if (e.key === 'Shift' && !e.altKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            uiElement.style.opacity = uiElement.style.opacity === '0' ? '1' : '0';
        }
        
        // ALT+W - Answer correctly
        if (e.key.toLowerCase() === 'w' && e.altKey && info.questionNum !== -1) {
            e.preventDefault();
            const question = questions[info.questionNum];
            if (!question || !question.answers || question.answers.length === 0) return;
            
            if (question.type === 'quiz') {
                const key = (question.answers[0] + 1).toString();
                window.dispatchEvent(new KeyboardEvent('keydown', { key: key }));
            } 
            else if (question.type === 'multiple_select_quiz') {
                question.answers.forEach(function(answer) {
                    const key = (answer + 1).toString();
                    window.dispatchEvent(new KeyboardEvent('keydown', { key: key }));
                });
                
                setTimeout(function() {
                    const submitBtn = FindByAttributeValue("data-functional-selector", "multi-select-submit-button", "button");
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
        const textElement = FindByAttributeValue("data-functional-selector", "question-index-counter", "div");
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
            const incrementElement = FindByAttributeValue("data-functional-selector", "score-increment", "span");
            if (incrementElement) {
                info.ILSetQuestion = info.questionNum;
                const incrementText = incrementElement.textContent;
                const increment = parseInt(incrementText.split(" ")[1]);
                
                if (!isNaN(increment) && increment !== 0) {
                    const ppt = Answered_PPT > 987 ? 1000 : Answered_PPT;
                    const adjustment = (ppt - increment) * 15;
                    
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
    const style = document.createElement('style');
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
        }
        button {
            transition: transform 0.2s ease;
        }
    `;
    document.head.appendChild(style);
})();
