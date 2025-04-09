// ==UserScript==
// @name         KaHack! Complete Working
// @version      5.0.1
// @namespace    https://github.com/jokeri2222
// @description  Complete working Kahoot hack with all features
// @match        https://kahoot.it/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ======================
    // CORE CONFIGURATION
    // ======================
    const Version = '5.0.1';
    let questions = [];
    const info = {
        numQuestions: 0,
        questionNum: -1,
        lastAnsweredQuestion: -1,
        defaultIL: true,
        ILSetQuestion: -1,
        streak: 0,
        highestStreak: 0,
        totalCorrect: 0,
        totalAnswered: 0,
        sessionStart: new Date()
    };

    // Settings with defaults
    let settings = {
        PPT: 950,
        Answered_PPT: 950,
        autoAnswer: false,
        showAnswers: false,
        inputLag: 100,
        rainbowSpeed: 300,
        isSoundEnabled: true,
        isDarkMode: true,
        stealthMode: false,
        autoJoin: {
            enabled: false,
            pin: '',
            nickname: 'KaHackUser'
        }
    };

    // State tracking
    let state = {
        isAltSPressed: false,
        isAltHPressed: false,
        isAltRPressed: false,
        rainbowInterval: null,
        mainInterval: null,
        answerHistory: [],
        sessionStats: {
            pointsEarned: 0,
            streaks: [],
            answerTimes: []
        }
    };

    // Color Schemes
    const colors = {
        dark: {
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
        },
        light: {
            primary: '#f0f0f5',
            secondary: '#e0e0ef',
            accent: '#c0c0df',
            text: '#333344',
            correct: '#00aa55',
            incorrect: '#ff1133',
            close: '#ff1133',
            minimize: '#5f5faf',
            hoverGlow: '0 0 8px rgba(0, 100, 200, 0.3)',
            rainbow: ['#ff0080', '#ff00ff', '#8000ff', '#0033ff', '#00ffff', '#00ff80', '#80ff00'],
            particleColors: ['#00aaff', '#ff00aa', '#ffaa00']
        }
    };

    let currentColors = colors.dark;
    let uiElement, content;

    // ======================
    // CORE FUNCTIONS
    // ======================

    function FindByAttributeValue(attribute, value, element_type) {
        element_type = element_type || "*";
        const All = document.getElementsByTagName(element_type);
        for (let i = 0; i < All.length; i++) {
            if (All[i].getAttribute(attribute) === value) return All[i];
        }
        return null;
    }

    function startRainbowEffect() {
        if (state.rainbowInterval) clearInterval(state.rainbowInterval);
        
        function applyRainbowColors() {
            const buttons = document.querySelectorAll(
                'button[data-functional-selector^="answer-"], button[data-functional-selector^="multi-select-button-"]'
            );
            
            buttons.forEach(button => {
                if (button) {
                    const randomColor = currentColors.rainbow[Math.floor(Math.random() * currentColors.rainbow.length)];
                    button.style.cssText = `
                        background-color: ${randomColor} !important;
                        transition: background-color ${settings.rainbowSpeed/1000}s ease !important;
                    `;
                }
            });
        }
        
        applyRainbowColors();
        state.rainbowInterval = setInterval(applyRainbowColors, settings.rainbowSpeed);
    }

    function stopRainbowEffect() {
        if (state.rainbowInterval) {
            clearInterval(state.rainbowInterval);
            state.rainbowInterval = null;
        }
        resetAnswerColors();
    }

    function resetAnswerColors() {
        const buttons = document.querySelectorAll(
            'button[data-functional-selector^="answer-"], button[data-functional-selector^="multi-select-button-"]'
        );
        buttons.forEach(button => {
            if (button) {
                button.style.removeProperty('background-color');
                button.style.removeProperty('transition');
            }
        });
    }

    // ======================
    // UI CREATION
    // ======================

    function createUI() {
        // Main UI Container
        uiElement = document.createElement('div');
        Object.assign(uiElement.style, {
            position: 'fixed',
            top: '20px',
            left: '20px',
            width: '350px',
            backgroundColor: currentColors.primary,
            borderRadius: '10px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
            zIndex: '9999',
            overflow: 'hidden',
            border: `1px solid ${currentColors.accent}`,
            transition: 'opacity 0.3s ease',
            willChange: 'transform'
        });

        // Header with Draggable Area
        const handle = document.createElement('div');
        Object.assign(handle.style, {
            padding: '12px 15px',
            backgroundColor: currentColors.secondary,
            color: currentColors.text,
            cursor: 'move',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            userSelect: 'none',
            borderBottom: `1px solid ${currentColors.accent}`,
            WebkitUserSelect: 'none'
        });

        const title = document.createElement('div');
        title.textContent = 'KaHack! Complete';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '16px';

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '5px';

        // Minimize Button
        const minimizeButton = document.createElement('div');
        minimizeButton.textContent = '─';
        Object.assign(minimizeButton.style, {
            width: '24px',
            height: '24px',
            backgroundColor: currentColors.minimize,
            color: currentColors.text,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'transform 0.2s ease'
        });

        // Close Button
        const closeButton = document.createElement('div');
        closeButton.textContent = '✕';
        Object.assign(closeButton.style, {
            width: '24px',
            height: '24px',
            backgroundColor: currentColors.close,
            color: currentColors.text,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
        });

        // Button Events
        [minimizeButton, closeButton].forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.1)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
            });
        });

        minimizeButton.addEventListener('click', function() {
            content.style.display = content.style.display === 'none' ? 'flex' : 'none';
        });

        closeButton.addEventListener('click', function() {
            document.body.removeChild(uiElement);
            settings.autoAnswer = false;
            settings.showAnswers = false;
            stopRainbowEffect();
        });

        buttonContainer.appendChild(minimizeButton);
        buttonContainer.appendChild(closeButton);
        handle.appendChild(title);
        handle.appendChild(buttonContainer);
        uiElement.appendChild(handle);

        // Content Container
        content = document.createElement('div');
        Object.assign(content.style, {
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            backgroundColor: currentColors.primary
        });

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
        inputBox.addEventListener('input', handleInputChange);
        quizIdSection.appendChild(inputBox);
        content.appendChild(quizIdSection);

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
        pointsLabel.style.color = currentColors.text;
        pointsLabel.style.minWidth = '40px';
        pointsLabel.style.textAlign = 'center';

        pointsSlider.addEventListener('input', function() {
            settings.PPT = +this.value;
            pointsLabel.textContent = settings.PPT;
        });

        pointsSliderContainer.appendChild(pointsSlider);
        pointsSliderContainer.appendChild(pointsLabel);
        pointsSection.appendChild(pointsSliderContainer);
        content.appendChild(pointsSection);

        // Answering Section
        const answeringSection = createSection('ANSWERING');
        
        answeringSection.appendChild(createToggle('Auto Answer', settings.autoAnswer, function(checked) {
            settings.autoAnswer = checked;
            info.ILSetQuestion = info.questionNum;
            optimizePerformance();
        }));

        answeringSection.appendChild(createToggle('Show Answers', settings.showAnswers, function(checked) {
            settings.showAnswers = checked;
            if (!settings.showAnswers && !state.isAltSPressed) {
                resetAnswerColors();
            }
        }));

        content.appendChild(answeringSection);

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
        rainbowLabel.style.color = currentColors.text;
        rainbowLabel.style.minWidth = '50px';
        rainbowLabel.style.textAlign = 'center';

        rainbowSlider.addEventListener('input', function() {
            settings.rainbowSpeed = +this.value;
            rainbowLabel.textContent = settings.rainbowSpeed + 'ms';
            if (state.rainbowInterval) {
                startRainbowEffect();
            }
        });

        const rainbowButton = document.createElement('button');
        rainbowButton.textContent = 'Toggle Rainbow';
        Object.assign(rainbowButton.style, {
            width: '100%',
            padding: '8px',
            marginTop: '10px',
            backgroundColor: currentColors.accent,
            color: currentColors.text,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
        });
        
        rainbowButton.addEventListener('click', function() {
            if (state.rainbowInterval) {
                stopRainbowEffect();
                rainbowButton.textContent = 'Enable Rainbow';
            } else {
                startRainbowEffect();
                rainbowButton.textContent = 'Disable Rainbow';
            }
        });
        
        rainbowContainer.appendChild(rainbowSlider);
        rainbowContainer.appendChild(rainbowLabel);
        rainbowSection.appendChild(rainbowContainer);
        rainbowSection.appendChild(rainbowButton);
        content.appendChild(rainbowSection);

        // Keybinds Section
        const keybindsSection = createSection('KEYBINDS');
        const keybindsList = document.createElement('div');
        keybindsList.style.color = currentColors.text;
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
        
        keybindsSection.appendChild(keybindsList);
        content.appendChild(keybindsSection);

        // Stats Section
        const statsSection = createSection('STATISTICS');
        
        statsSection.appendChild(createStatElement('Question: 0/0'));
        statsSection.appendChild(createStatElement('Streak: 0 (Highest: 0)'));
        statsSection.appendChild(createStatElement('Correct: 0/0 (0%)'));
        
        content.appendChild(statsSection);

        // Settings Section
        const settingsSection = createSection('SETTINGS');
        
        settingsSection.appendChild(createToggle('Dark Mode', settings.isDarkMode, function(checked) {
            settings.isDarkMode = checked;
            currentColors = checked ? colors.dark : colors.light;
            updateUITheme();
        }));

        settingsSection.appendChild(createToggle('Stealth Mode', settings.stealthMode, function(checked) {
            settings.stealthMode = checked;
            optimizePerformance();
        }));

        content.appendChild(settingsSection);

        // Version Info
        const versionSection = createSection('INFO');
        versionSection.appendChild(createStatElement('Version: ' + Version));
        content.appendChild(versionSection);

        // Final Assembly
        uiElement.appendChild(content);
    }

    function createSection(titleText) {
        const section = document.createElement('div');
        Object.assign(section.style, {
            backgroundColor: currentColors.secondary,
            borderRadius: '8px',
            padding: '12px',
            border: `1px solid ${currentColors.accent}`,
            transition: 'transform 0.2s ease'
        });

        const header = document.createElement('h3');
        header.textContent = titleText;
        Object.assign(header.style, {
            margin: '0 0 10px 0',
            color: currentColors.text,
            fontSize: '16px'
        });

        section.appendChild(header);
        return section;
    }

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
        label.style.color = currentColors.text;
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
            backgroundColor: checked ? currentColors.correct : currentColors.incorrect,
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
            slider.style.backgroundColor = this.checked ? currentColors.correct : currentColors.incorrect;
            sliderBefore.style.left = this.checked ? '26px' : '4px';
        });

        toggle.appendChild(input);
        toggle.appendChild(slider);
        slider.appendChild(sliderBefore);
        container.appendChild(label);
        container.appendChild(toggle);

        return container;
    }

    function createStatElement(text) {
        const el = document.createElement('div');
        el.textContent = text;
        el.style.color = currentColors.text;
        return el;
    }

    function updateUITheme() {
        if (!uiElement) return;

        uiElement.style.backgroundColor = currentColors.primary;
        uiElement.style.borderColor = currentColors.accent;

        const headers = document.querySelectorAll('.kahack-header');
        headers.forEach(header => {
            header.style.backgroundColor = currentColors.secondary;
            header.style.borderBottomColor = currentColors.accent;
            header.style.color = currentColors.text;
        });

        const sections = document.querySelectorAll('.kahack-content > div');
        sections.forEach(section => {
            section.style.backgroundColor = currentColors.secondary;
            section.style.borderColor = currentColors.accent;
        });

        const textElements = document.querySelectorAll('[style*="color"]');
        textElements.forEach(el => {
            if (el.style.color.includes('text')) {
                el.style.color = currentColors.text;
            }
        });
    }

    // ======================
    // MAIN FUNCTIONALITY
    // ======================

    function handleInputChange() {
        const inputBox = document.querySelector('.kahack-content input[type="text"]');
        if (!inputBox) return;
        
        const quizID = inputBox.value.trim();
        
        if (quizID === "") {
            inputBox.style.backgroundColor = 'white';
            info.numQuestions = 0;
            return;
        }
        
        fetch('https://kahoot.it/rest/kahoots/' + quizID)
            .then(function(response) {
                if (!response.ok) throw new Error('Invalid');
                return response.json();
            })
            .then(function(data) {
                inputBox.style.backgroundColor = currentColors.correct;
                questions = parseQuestions(data.questions);
                info.numQuestions = questions.length;
            })
            .catch(function() {
                inputBox.style.backgroundColor = currentColors.incorrect;
                info.numQuestions = 0;
            });
    }

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

    function highlightAnswers(question) {
        if (!question) return;
        
        const answerButtons = document.querySelectorAll(
            'button[data-functional-selector^="answer-"], button[data-functional-selector^="multi-select-button-"]'
        );
        
        answerButtons.forEach(function(button) {
            if (button) button.style.removeProperty('background-color');
        });
        
        if (question.answers) {
            question.answers.forEach(function(answer) {
                const btn = FindByAttributeValue("data-functional-selector", "answer-" + answer, "button") || 
                          FindByAttributeValue("data-functional-selector", "multi-select-button-" + answer, "button");
                if (btn) btn.style.backgroundColor = currentColors.correct;
            });
        }
        
        if (question.incorrectAnswers) {
            question.incorrectAnswers.forEach(function(answer) {
                const btn = FindByAttributeValue("data-functional-selector", "answer-" + answer, "button") || 
                          FindByAttributeValue("data-functional-selector", "multi-select-button-" + answer, "button");
                if (btn) btn.style.backgroundColor = currentColors.incorrect;
            });
        }
    }

    function answerQuestion(question, answerIndex) {
        const key = (answerIndex + 1).toString();
        window.dispatchEvent(new KeyboardEvent('keydown', { key }));
        
        if (question.type === 'multiple_select_quiz') {
            setTimeout(() => {
                const submitBtn = FindByAttributeValue("data-functional-selector", "multi-select-submit-button", "button");
                if (submitBtn) submitBtn.click();
            }, 50);
        }
    }

    function onQuestionStart() {
        const question = questions[info.questionNum];
        if (!question) return;
        
        if (settings.showAnswers || state.isAltSPressed) {
            highlightAnswers(question);
        }
        
        if (settings.autoAnswer) {
            const answerTime = (question.time - question.time / (500 / (settings.PPT - 500))) - settings.inputLag;
            setTimeout(() => {
                answerQuestion(question, question.answers[0]);
            }, answerTime);
        }
    }

    function optimizePerformance() {
        clearInterval(state.mainInterval);
        
        const delay = settings.stealthMode ? 
            Math.floor(Math.random() * 200) + 50 : // Random delay in stealth mode
            (settings.autoAnswer ? 50 : 1000); // Frequent checks when auto-answering
        
        state.mainInterval = setInterval(mainLoop, delay);
    }

    function mainLoop() {
        // Update question number
        const textElement = FindByAttributeValue("data-functional-selector", "question-index-counter", "div");
        if (textElement) {
            info.questionNum = parseInt(textElement.textContent) - 1;
        }
        
        // Detect new question
        if (FindByAttributeValue("data-functional-selector", "answer-0", "button") && 
            info.lastAnsweredQuestion !== info.questionNum) {
            info.lastAnsweredQuestion = info.questionNum;
            onQuestionStart();
        }
    }

    // ======================
    // INITIALIZATION
    // ======================

    function init() {
        createUI();
        optimizePerformance();
        
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
                border-radius: '50%';
                cursor: pointer;
            }
            button {
                transition: transform 0.2s ease;
            }
        `;
        document.head.appendChild(style);

        // Add to DOM
        document.body.appendChild(uiElement);

        // Set up keybinds
        document.addEventListener('keydown', function(e) {
            // ALT+H - Toggle UI visibility
            if (e.key.toLowerCase() === 'h' && e.altKey) {
                e.preventDefault();
                state.isAltHPressed = !state.isAltHPressed;
                uiElement.style.opacity = state.isAltHPressed ? '0' : '1';
                uiElement.style.pointerEvents = state.isAltHPressed ? 'none' : 'auto';
            }
            
            // SHIFT - Quick hide/show
            if (e.key === 'Shift') {
                e.preventDefault();
                uiElement.style.opacity = uiElement.style.opacity === '0' ? '1' : '0';
            }
            
            // ALT+S - Show answers while held
            if (e.key.toLowerCase() === 's' && e.altKey) {
                e.preventDefault();
                state.isAltSPressed = true;
                if (questions[info.questionNum]) {
                    highlightAnswers(questions[info.questionNum]);
                }
            }
            
            // ALT+R - Rainbow mode while held
            if (e.key.toLowerCase() === 'r' && e.altKey && !state.isAltRPressed) {
                e.preventDefault();
                state.isAltRPressed = true;
                startRainbowEffect();
            }
        });

        document.addEventListener('keyup', function(e) {
            // ALT+S released - hide answers
            if (e.key.toLowerCase() === 's' && state.isAltSPressed) {
                state.isAltSPressed = false;
                if (!settings.showAnswers) {
                    resetAnswerColors();
                }
            }
            
            // ALT+R released - stop rainbow mode
            if (e.key.toLowerCase() === 'r' && state.isAltRPressed) {
                state.isAltRPressed = false;
                stopRainbowEffect();
            }
        });
    }

    // Start the script
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 500);
    }

})();
