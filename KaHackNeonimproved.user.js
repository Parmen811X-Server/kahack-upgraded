// ==UserScript==
// @name         KaHack! Neon Pro
// @version      2.3.0
// @namespace    https://github.com/jokeri2222
// @description  Ultra-smooth Kahoot hack with optimized neon UI
// @updateURL    https://github.com/jokeri2222/KaHack/raw/main/KaHack-Neon-Pro.meta.js
// @downloadURL  https://github.com/jokeri2222/KaHack/raw/main/KaHack-Neon-Pro.user.js
// @author       jokeri2222
// @match        https://kahoot.it/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kahoot.it
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ======================
    // CORE CONFIGURATION
    // ======================
    const Version = '2.3.0';
    const colors = {
        primary: 'rgba(15, 5, 30, 0.97)',
        secondary: 'rgba(25, 10, 50, 0.95)',
        accent: 'rgba(120, 80, 255, 0.8)',
        text: '#f0f0ff',
        correct: 'hsl(155, 100%, 60%)',
        incorrect: 'hsl(350, 100%, 65%)',
        close: 'hsl(350, 100%, 65%)',
        minimize: 'hsl(240, 100%, 75%)',
        glow: '0 0 20px rgba(120, 220, 255, 0.9)',
        rainbow: ['#ff0080', '#ff00ff', '#8000ff', '#0033ff', '#00ffff', '#00ff80', '#80ff00'],
        particleColors: ['#00ffff', '#ff00ff', '#ffff00']
    };

    // Core Variables
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

    // ======================
    // OPTIMIZED UI COMPONENTS
    // ======================

    // Main UI Container
    const uiElement = document.createElement('div');
    Object.assign(uiElement.style, {
        position: 'fixed',
        top: '20px',
        left: '20px',
        width: '380px', // Increased width for better spacing
        maxHeight: '70vh',
        backgroundColor: colors.primary,
        borderRadius: '12px',
        boxShadow: `${colors.glow}, inset 0 0 15px rgba(100, 220, 255, 0.4)`,
        zIndex: '9999',
        overflow: 'hidden',
        border: `1px solid ${colors.accent}`,
        transform: 'translateZ(0)',
        willChange: 'transform, opacity',
        display: 'flex',
        flexDirection: 'column'
    });

    // Draggable Header
    const header = document.createElement('div');
    Object.assign(header.style, {
        padding: '12px 20px',
        background: `linear-gradient(90deg, ${colors.secondary}, ${colors.primary})`,
        color: colors.text,
        cursor: 'move',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        userSelect: 'none',
        borderBottom: `1px solid ${colors.accent}`,
        flexShrink: '0'
    });

    // Title
    const title = document.createElement('div');
    title.textContent = 'KaHack! NEON PRO';
    Object.assign(title.style, {
        fontWeight: 'bold',
        fontSize: '18px',
        textShadow: `0 0 12px ${colors.accent}`,
        whiteSpace: 'nowrap'
    });

    // Control Buttons
    function createControlBtn(symbol, color) {
        const btn = document.createElement('div');
        btn.textContent = symbol;
        Object.assign(btn.style, {
            width: '26px',
            height: '26px',
            background: color,
            color: colors.text,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease',
            boxShadow: `0 0 8px ${color}`,
            flexShrink: '0'
        });
        return btn;
    }

    const minimizeBtn = createControlBtn('─', colors.minimize);
    const closeBtn = createControlBtn('✕', colors.close);

    // Button container
    const btnContainer = document.createElement('div');
    Object.assign(btnContainer.style, {
        display: 'flex',
        gap: '8px'
    });
    btnContainer.append(minimizeBtn, closeBtn);
    header.append(title, btnContainer);
    uiElement.appendChild(header);

    // Scrollable Content
    const content = document.createElement('div');
    Object.assign(content.style, {
        padding: '15px',
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        flexGrow: '1',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    });

    // ======================
    // UI SECTION TEMPLATES
    // ======================

    function createSection(titleText) {
        const section = document.createElement('div');
        Object.assign(section.style, {
            background: `linear-gradient(145deg, ${colors.secondary}, ${colors.primary})`,
            borderRadius: '10px',
            padding: '15px',
            border: `1px solid ${colors.accent}`,
            boxShadow: `0 0 12px rgba(100, 220, 255, 0.2)`,
            flexShrink: '0'
        });

        const header = document.createElement('h3');
        header.textContent = titleText;
        Object.assign(header.style, {
            margin: '0 0 12px 0',
            color: colors.text,
            fontSize: '16px',
            fontWeight: '600',
            textShadow: `0 0 8px ${colors.accent}`
        });

        section.appendChild(header);
        return { section, body: section };
    }

    function createInput(placeholder) {
        const input = document.createElement('input');
        Object.assign(input.style, {
            width: '100%',
            padding: '10px 15px',
            borderRadius: '6px',
            border: `1px solid ${colors.accent}`,
            background: 'rgba(0, 0, 0, 0.3)',
            color: colors.text,
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.3s ease',
            boxSizing: 'border-box' // Added for better input sizing
        });
        input.placeholder = placeholder;
        return input;
    }

    function createSlider(min, max, value) {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '10px';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.value = value;
        Object.assign(slider.style, {
            flex: '1',
            height: '6px',
            WebkitAppearance: 'none',
            background: `linear-gradient(90deg, ${colors.accent}, ${colors.correct})`,
            borderRadius: '3px'
        });

        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = value;
        Object.assign(valueDisplay.style, {
            color: colors.text,
            minWidth: '50px',
            textAlign: 'center',
            textShadow: `0 0 5px ${colors.accent}`
        });

        container.append(slider, valueDisplay);
        return { container, slider, valueDisplay };
    }

    function createToggle(label, checked, onChange) {
        const container = document.createElement('div');
        Object.assign(container.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            margin: '10px 0'
        });

        const labelEl = document.createElement('span');
        labelEl.textContent = label;
        Object.assign(labelEl.style, {
            color: colors.text,
            fontSize: '14px'
        });

        const toggle = document.createElement('label');
        Object.assign(toggle.style, {
            position: 'relative',
            display: 'inline-block',
            width: '50px',
            height: '26px'
        });

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = checked;
        input.style.opacity = '0';

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
            borderRadius: '34px',
            boxShadow: checked ? `0 0 10px ${colors.correct}` : 'none'
        });

        const knob = document.createElement('span');
        Object.assign(knob.style, {
            position: 'absolute',
            height: '20px',
            width: '20px',
            left: checked ? '26px' : '4px',
            bottom: '3px',
            backgroundColor: '#fff',
            transition: '.4s',
            borderRadius: '50%',
            boxShadow: `0 0 5px rgba(0,0,0,0.3)`
        });

        input.addEventListener('change', () => {
            const isChecked = input.checked;
            slider.style.backgroundColor = isChecked ? colors.correct : colors.incorrect;
            slider.style.boxShadow = isChecked ? `0 0 10px ${colors.correct}` : 'none';
            knob.style.left = isChecked ? '26px' : '4px';
            onChange(isChecked);
        });

        slider.appendChild(knob);
        toggle.append(input, slider);
        container.append(labelEl, toggle);
        return container;
    }

    function createButton(text, onClick) {
        const btn = document.createElement('button');
        btn.textContent = text;
        Object.assign(btn.style, {
            width: '100%',
            padding: '10px',
            background: `linear-gradient(145deg, ${colors.accent}, ${colors.secondary})`,
            color: colors.text,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            textShadow: `0 0 5px ${colors.accent}`,
            transition: 'all 0.2s ease'
        });

        btn.addEventListener('click', () => {
            onClick();
            createParticles(btn, 5);
        });
        return btn;
    }

    // ======================
    // CORE FUNCTIONALITY IMPORTS
    // ======================

    // Helper function to find elements by attribute
    function FindByAttributeValue(attribute, value, element_type) {
        element_type = element_type || "*";
        const All = document.getElementsByTagName(element_type);
        for (let i = 0; i < All.length; i++) {
            if (All[i].getAttribute(attribute) === value) return All[i];
        }
        return null;
    }

    // Fixed Rainbow Mode Functions
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

    // Fixed Answer Highlighting
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

    // ======================
    // BUILD THE UI
    // ======================

    // Quiz ID Section
    const quizIdSection = createSection('QUIZ ID');
    const quizIdInput = createInput('Enter Quiz ID...');
    quizIdSection.body.appendChild(quizIdInput);
    content.appendChild(quizIdSection.section);

    // Points Section
    const pointsSection = createSection('POINTS PER QUESTION');
    const pointsSlider = createSlider(500, 1000, 950);
    pointsSection.body.appendChild(pointsSlider.container);
    content.appendChild(pointsSection.section);

    // Answering Section
    const answeringSection = createSection('ANSWERING');
    answeringSection.body.appendChild(
        createToggle('Auto Answer', autoAnswer, (checked) => {
            autoAnswer = checked;
            info.ILSetQuestion = info.questionNum;
        })
    );
    answeringSection.body.appendChild(
        createToggle('Show Answers', showAnswers, (checked) => {
            showAnswers = checked;
            if (!showAnswers && !isAltSPressed) resetAnswerColors();
        })
    );
    content.appendChild(answeringSection.section);

    // Rainbow Section
    const rainbowSection = createSection('RAINBOW MODE');
    const rainbowSlider = createSlider(50, 1000, 300);
    rainbowSection.body.appendChild(rainbowSlider.container);
    rainbowSection.body.appendChild(
        createButton('Toggle Rainbow', () => {
            if (rainbowInterval) {
                stopRainbowEffect();
            } else {
                startRainbowEffect();
            }
        })
    );
    content.appendChild(rainbowSection.section);

    // Keybinds Section
    const keybindsSection = createSection('KEYBINDS');
    const keybinds = [
        ['ALT + H', 'Toggle UI'],
        ['ALT + W', 'Correct answer'],
        ['ALT + S', 'Show answers'],
        ['ALT + R', 'Rainbow mode'],
        ['Shift', 'Quick hide']
    ];

    keybinds.forEach(([key, desc]) => {
        const row = document.createElement('div');
        Object.assign(row.style, {
            display: 'flex',
            justifyContent: 'space-between',
            margin: '6px 0',
            fontSize: '13px'
        });
        row.innerHTML = `<span style="color:${colors.accent};font-weight:bold">${key}</span><span>${desc}</span>`;
        keybindsSection.body.appendChild(row);
    });
    content.appendChild(keybindsSection.section);

    // Info Section
    const infoSection = createSection('INFO');
    const questionsLabel = document.createElement('div');
    questionsLabel.textContent = 'Question: 0/0';
    questionsLabel.style.margin = '5px 0';
    infoSection.body.appendChild(questionsLabel);

    const inputLagLabel = document.createElement('div');
    inputLagLabel.textContent = 'Input lag: 100ms';
    inputLagLabel.style.margin = '5px 0';
    infoSection.body.appendChild(inputLagLabel);

    const versionLabel = document.createElement('div');
    versionLabel.textContent = `Version: ${Version}`;
    versionLabel.style.margin = '5px 0';
    infoSection.body.appendChild(versionLabel);
    content.appendChild(infoSection.section);

    // Final Assembly
    uiElement.appendChild(content);
    document.body.appendChild(uiElement);

    // ======================
    // OPTIMIZED DRAGGING
    // ======================

    let dragData = null;
    const dragThreshold = 5;

    header.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        
        dragData = {
            startX: e.clientX,
            startY: e.clientY,
            offsetX: e.clientX - uiElement.offsetLeft,
            offsetY: e.clientY - uiElement.offsetTop,
            dragging: false
        };

        e.preventDefault();
    });

    function handleDragMove(e) {
        if (!dragData) return;

        const dx = Math.abs(e.clientX - dragData.startX);
        const dy = Math.abs(e.clientY - dragData.startY);

        if (!dragData.dragging && (dx > dragThreshold || dy > dragThreshold)) {
            dragData.dragging = true;
            uiElement.style.cursor = 'grabbing';
            uiElement.style.userSelect = 'none';
        }

        if (dragData.dragging) {
            const x = Math.max(0, Math.min(window.innerWidth - uiElement.offsetWidth, e.clientX - dragData.offsetX));
            const y = Math.max(0, Math.min(window.innerHeight - uiElement.offsetHeight, e.clientY - dragData.offsetY));
            
            requestAnimationFrame(() => {
                uiElement.style.left = `${x}px`;
                uiElement.style.top = `${y}px`;
            });
        }
    }

    function handleDragEnd() {
        if (dragData) {
            if (dragData.dragging) {
                uiElement.style.cursor = '';
                uiElement.style.userSelect = '';
            }
            dragData = null;
        }
    }

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);

    // ======================
    // UI CONTROLS
    // ======================

    // Minimize Toggle
    let isMinimized = false;
    minimizeBtn.addEventListener('click', () => {
        isMinimized = !isMinimized;
        content.style.display = isMinimized ? 'none' : 'flex';
        minimizeBtn.textContent = isMinimized ? '+' : '─';
    });

    // Close Button
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(uiElement);
        autoAnswer = false;
        showAnswers = false;
        stopRainbowEffect();
    });

    // ======================
    // CORE FUNCTIONALITY
    // ======================

    // Quiz ID Validation
    quizIdInput.addEventListener('input', () => {
        const quizID = quizIdInput.value.trim();
        
        if (quizID === "") {
            quizIdInput.style.borderColor = colors.accent;
            quizIdInput.style.boxShadow = 'none';
            info.numQuestions = 0;
            questionsLabel.textContent = 'Question: 0/0';
            return;
        }
        
        fetch(`https://kahoot.it/rest/kahoots/${quizID}`)
            .then(response => {
                if (!response.ok) throw new Error('Invalid');
                return response.json();
            })
            .then(data => {
                quizIdInput.style.borderColor = colors.correct;
                quizIdInput.style.boxShadow = `0 0 10px ${colors.correct}`;
                questions = parseQuestions(data.questions);
                info.numQuestions = questions.length;
                questionsLabel.textContent = `Question: 0/${info.numQuestions}`;
            })
            .catch(() => {
                quizIdInput.style.borderColor = colors.incorrect;
                quizIdInput.style.boxShadow = `0 0 10px ${colors.incorrect}`;
                info.numQuestions = 0;
                questionsLabel.textContent = 'Question: 0/0';
            });
    });

    // Points Slider
    pointsSlider.slider.addEventListener('input', () => {
        PPT = +pointsSlider.slider.value;
        pointsSlider.valueDisplay.textContent = PPT;
    });

    // Rainbow Slider
    rainbowSlider.slider.addEventListener('input', () => {
        rainbowSpeed = +rainbowSlider.slider.value;
        rainbowSlider.valueDisplay.textContent = `${rainbowSpeed}ms`;
        if (rainbowInterval) startRainbowEffect();
    });

    // ======================
    // GAME FUNCTIONS
    // ======================

    function parseQuestions(questionsJson) {
        return questionsJson.map(question => {
            const q = { type: question.type, time: question.time };
            
            if (['quiz', 'multiple_select_quiz'].includes(question.type)) {
                q.answers = [];
                q.incorrectAnswers = [];
                question.choices.forEach((choice, i) => {
                    (choice.correct ? q.answers : q.incorrectAnswers).push(i);
                });
            }
            
            if (question.type === 'open_ended') {
                q.answers = question.choices.map(choice => choice.answer);
            }
            
            return q;
        });
    }

    function answer(question, time) {
        Answered_PPT = PPT;
        const delay = question.type === 'multiple_select_quiz' ? 60 : 0;
        
        setTimeout(() => {
            if (question.type === 'quiz') {
                const key = (question.answers[0] + 1).toString();
                window.dispatchEvent(new KeyboardEvent('keydown', { key }));
            } 
            else if (question.type === 'multiple_select_quiz') {
                question.answers.forEach(answer => {
                    const key = (answer + 1).toString();
                    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
                });
                
                setTimeout(() => {
                    const submitBtn = document.querySelector('[data-functional-selector="multi-select-submit-button"]');
                    if (submitBtn) submitBtn.click();
                }, 50);
            }
        }, time - delay);
    }

    function onQuestionStart() {
        const question = questions[info.questionNum];
        if (!question) return;
        
        if (showAnswers || isAltSPressed) highlightAnswers(question);
        if (autoAnswer) {
            const answerTime = (question.time - question.time / (500 / (PPT - 500))) - inputLag;
            answer(question, answerTime);
        }
    }

    // ======================
    // EVENT LISTENERS
    // ======================

    document.addEventListener('keydown', e => {
        // ALT+H - Toggle UI
        if (e.key.toLowerCase() === 'h' && e.altKey) {
            e.preventDefault();
            isAltHPressed = !isAltHPressed;
            uiElement.style.opacity = isAltHPressed ? '0' : '1';
            uiElement.style.pointerEvents = isAltHPressed ? 'none' : 'auto';
        }
        
        // SHIFT - Quick hide
        if (e.key === 'Shift' && !e.altKey) {
            e.preventDefault();
            uiElement.style.opacity = uiElement.style.opacity === '0' ? '1' : '0';
        }
        
        // ALT+W - Answer correctly
        if (e.key.toLowerCase() === 'w' && e.altKey && info.questionNum !== -1) {
            e.preventDefault();
            const question = questions[info.questionNum];
            if (!question?.answers) return;
            
            if (question.type === 'quiz') {
                const key = (question.answers[0] + 1).toString();
                window.dispatchEvent(new KeyboardEvent('keydown', { key }));
            } 
            else if (question.type === 'multiple_select_quiz') {
                question.answers.forEach(answer => {
                    const key = (answer + 1).toString();
                    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
                });
                
                setTimeout(() => {
                    const submitBtn = document.querySelector('[data-functional-selector="multi-select-submit-button"]');
                    if (submitBtn) submitBtn.click();
                }, 50);
            }
        }
        
        // ALT+S - Show answers
        if (e.key.toLowerCase() === 's' && e.altKey && info.questionNum !== -1) {
            e.preventDefault();
            isAltSPressed = true;
            highlightAnswers(questions[info.questionNum]);
        }
        
        // ALT+R - Rainbow mode
        if (e.key.toLowerCase() === 'r' && e.altKey) {
            e.preventDefault();
            isAltRPressed = true;
            startRainbowEffect();
        }
    });

    document.addEventListener('keyup', e => {
        if (e.key.toLowerCase() === 's' && isAltSPressed) {
            isAltSPressed = false;
            if (!showAnswers) resetAnswerColors();
        }
        
        if (e.key.toLowerCase() === 'r' && isAltRPressed) {
            isAltRPressed = false;
            stopRainbowEffect();
        }
    });

    // Main Game Loop
    setInterval(() => {
        // Update question counter
        const counter = document.querySelector('[data-functional-selector="question-index-counter"]');
        if (counter) {
            info.questionNum = parseInt(counter.textContent) - 1;
            questionsLabel.textContent = `Question: ${info.questionNum + 1}/${info.numQuestions}`;
        }
        
        // Detect new question
        if (document.querySelector('[data-functional-selector^="answer-"]') && 
            info.lastAnsweredQuestion !== info.questionNum) {
            info.lastAnsweredQuestion = info.questionNum;
            onQuestionStart();
        }
        
        // Auto-answer calibration
        if (autoAnswer && info.ILSetQuestion !== info.questionNum) {
            const incrementEl = document.querySelector('[data-functional-selector="score-increment"]');
            if (incrementEl) {
                info.ILSetQuestion = info.questionNum;
                const increment = parseInt(incrementEl.textContent.split(" ")[1]);
                
                if (!isNaN(increment)) {
                    const ppt = Math.min(Answered_PPT, 987);
                    const adjustment = (ppt - increment) * 15;
                    inputLag = Math.max(0, inputLag + adjustment);
                    inputLagLabel.textContent = `Input lag: ${inputLag}ms`;
                }
            }
        }
    }, 50);

    // ======================
    // STYLES
    // ======================

    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
        }
        
        .kahack-neon-ui::-webkit-scrollbar {
            width: 6px;
            background: transparent;
        }
        
        .kahack-neon-ui::-webkit-scrollbar-thumb {
            background: ${colors.accent};
            border-radius: 3px;
        }
        
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            background: ${colors.text};
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 8px ${colors.accent};
            border: 1px solid ${colors.accent};
        }
        
        button {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px ${colors.accent};
        }
    `;
    document.head.appendChild(style);

    // ======================
    // PARTICLES
    // ======================

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
            
            const startTime = performance.now();
            
            function animate(time) {
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const x = centerX + Math.cos(angle) * distance * progress;
                const y = centerY + Math.sin(angle) * distance * progress;
                
                particle.style.transform = `translate(${x - centerX}px, ${y - centerY}px)`;
                particle.style.opacity = 0.8 * (1 - progress);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    particle.remove();
                }
            }
            
            requestAnimationFrame(animate);
        }
    }

    // Add particle effects to buttons
    [minimizeBtn, closeBtn].forEach(btn => {
        btn.addEventListener('mouseenter', () => createParticles(btn, 3));
        btn.addEventListener('click', () => createParticles(btn, 5));
    });
})();
