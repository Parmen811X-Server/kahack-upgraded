// ==UserScript==
// @name         KaHack! Ultimate Edition
// @version      6.1.0
// @namespace    https://github.com/jokeri2222
// @description  Advanced Kahoot hack with scrollable UI and bot features
// @match        https://kahoot.it/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ======================
    // CORE CONFIGURATION
    // ======================
    const Version = '6.1.0';
    let questions = [];
    const info = {
        numQuestions: 0,
        questionNum: -1,
        lastAnsweredQuestion: -1,
        streak: 0,
        highestStreak: 0,
        totalCorrect: 0,
        totalAnswered: 0,
        botCount: 0,
        hostToken: null,
        ILSetQuestion: -1
    };

    let settings = {
        PPT: 950,
        autoAnswer: false,
        showAnswers: false,
        inputLag: 100,
        rainbowSpeed: 300,
        isSoundEnabled: true,
        isDarkMode: true,
        stealthMode: false,
        maxBots: 50,
        botJoinDelay: 1000
    };

    let state = {
        isAltSPressed: false,
        isAltHPressed: false,
        isAltRPressed: false,
        rainbowInterval: null,
        mainInterval: null,
        isDragging: false,
        dragOffsetX: 0,
        dragOffsetY: 0,
        bots: [],
        websocket: null
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
            bot: '#00ffff',
            host: '#ff00ff',
            hoverGlow: '0 0 8px rgba(100, 220, 255, 0.5)',
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
            bot: '#0088ff',
            host: '#cc00ff'
        }
    };

    let currentColors = colors.dark;
    let uiElement, content, contentWrapper;

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

    function createParticles(element, count = 5) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const size = Math.random() * 4 + 2;
            const color = currentColors.particleColors[Math.floor(Math.random() * currentColors.particleColors.length)];
            
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

    function startRainbowEffect() {
        if (state.rainbowInterval) clearInterval(state.rainbowInterval);
        
        function applyRainbowColors() {
            const buttons = document.querySelectorAll(
                'button[data-functional-selector^="answer-"], button[data-functional-selector^="multi-select-button-"]'
            );
            
            buttons.forEach(button => {
                if (button) {
                    const hue = Math.floor(Math.random() * 360);
                    button.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
                    button.style.transition = `background-color ${settings.rainbowSpeed/1000}s ease`;
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
    // BOT & HOST FUNCTIONS
    // ======================

    function joinAsBot(name, gamePin) {
        return new Promise((resolve) => {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = `https://kahoot.it/?pin=${gamePin}&bot=${name}`;
            
            iframe.onload = () => {
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    resolve();
                }, 3000);
            };
            
            document.body.appendChild(iframe);
        });
    }

    async function startMassJoin() {
        const gamePin = prompt('Enter game PIN for bots:');
        if (!gamePin) return;
        
        const botCount = parseInt(prompt('How many bots? (Max 50)', '10'));
        if (isNaN(botCount) || botCount < 1 || botCount > 50) {
            alert('Invalid number!');
            return;
        }
        
        for (let i = 1; i <= botCount; i++) {
            const botName = `Bot${Math.floor(Math.random() * 1000)}`;
            await joinAsBot(botName, gamePin);
            info.botCount++;
            updateStats();
            await new Promise(resolve => setTimeout(resolve, settings.botJoinDelay));
        }
    }

    function sniffHostToken() {
        if (info.hostToken) {
            alert(`Host token already found: ${info.hostToken}`);
            return;
        }
        
        const origWebSocket = window.WebSocket;
        window.WebSocket = function(...args) {
            const ws = new origWebSocket(...args);
            
            ws.addEventListener('message', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.channel === '/service/player' && data.data?.id) {
                        info.hostToken = data.data.id;
                        updateStats();
                        alert(`Host token captured: ${info.hostToken}`);
                    }
                } catch (e) {}
            });
            
            state.websocket = ws;
            return ws;
        };
        
        alert('Host token sniffer activated! Join a game as player.');
    }

    // ======================
    // UI FUNCTIONS
    // ======================

    function createUI() {
        // Main UI Container
        uiElement = document.createElement('div');
        Object.assign(uiElement.style, {
            position: 'fixed',
            top: '20px',
            left: '20px',
            width: '350px',
            maxHeight: '70vh',
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
            borderBottom: `1px solid ${currentColors.accent}`
        });

        const title = document.createElement('div');
        title.textContent = 'KaHack! Ultimate';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '16px';

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
        minimizeButton.addEventListener('click', function() {
            contentWrapper.style.display = contentWrapper.style.display === 'none' ? 'block' : 'none';
            createParticles(minimizeButton, 5);
        });

        closeButton.addEventListener('click', function() {
            document.body.removeChild(uiElement);
            settings.autoAnswer = false;
            settings.showAnswers = false;
            stopRainbowEffect();
            createParticles(closeButton, 5);
        });

        // Dragging Functionality
        handle.addEventListener('mousedown', function(e) {
            state.isDragging = true;
            state.dragOffsetX = e.clientX - uiElement.getBoundingClientRect().left;
            state.dragOffsetY = e.clientY - uiElement.getBoundingClientRect().top;
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', function(e) {
            if (state.isDragging) {
                const x = Math.max(10, Math.min(window.innerWidth - uiElement.offsetWidth - 10, e.clientX - state.dragOffsetX));
                const y = Math.max(10, Math.min(window.innerHeight - uiElement.offsetHeight - 10, e.clientY - state.dragOffsetY));
                
                uiElement.style.left = `${x}px`;
                uiElement.style.top = `${y}px`;
            }
        });

        document.addEventListener('mouseup', function() {
            state.isDragging = false;
            document.body.style.userSelect = '';
        });

        // Assemble Header
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '5px';
        buttonContainer.appendChild(minimizeButton);
        buttonContainer.appendChild(closeButton);
        
        handle.appendChild(title);
        handle.appendChild(buttonContainer);
        uiElement.appendChild(handle);

        // Create scrollable content wrapper
        contentWrapper = document.createElement('div');
        Object.assign(contentWrapper.style, {
            maxHeight: 'calc(70vh - 50px)',
            overflowY: 'auto',
            scrollbarWidth: 'thin'
        });

        // Create Content Container
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
            transition: 'all 0.3s ease'
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
        pointsSlider.value = settings.PPT;
        pointsSlider.style.flex = '1';

        const pointsLabel = document.createElement('span');
        pointsLabel.textContent = settings.PPT;
        pointsLabel.style.color = currentColors.text;
        pointsLabel.style.minWidth = '40px';

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
        rainbowSlider.value = settings.rainbowSpeed;
        rainbowSlider.style.flex = '1';

        const rainbowLabel = document.createElement('span');
        rainbowLabel.textContent = settings.rainbowSpeed + 'ms';
        rainbowLabel.style.color = currentColors.text;
        rainbowLabel.style.minWidth = '50px';

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
            createParticles(rainbowButton, 5);
        });
        
        rainbowContainer.appendChild(rainbowSlider);
        rainbowContainer.appendChild(rainbowLabel);
        rainbowSection.appendChild(rainbowContainer);
        rainbowSection.appendChild(rainbowButton);
        content.appendChild(rainbowSection);

        // Bot Army Section
        const botSection = createSection('BOT ARMY');
        
        const botButton = document.createElement('button');
        botButton.textContent = 'Start Mass Join';
        Object.assign(botButton.style, {
            width: '100%',
            padding: '8px',
            backgroundColor: currentColors.bot,
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '10px',
            transition: 'transform 0.2s ease'
        });
        botButton.addEventListener('click', startMassJoin);
        botButton.addEventListener('mouseenter', () => botButton.style.transform = 'scale(1.02)');
        botButton.addEventListener('mouseleave', () => botButton.style.transform = 'scale(1)');
        botSection.appendChild(botButton);

        const hostButton = document.createElement('button');
        hostButton.textContent = 'Sniff Host Token';
        Object.assign(hostButton.style, {
            width: '100%',
            padding: '8px',
            backgroundColor: currentColors.host,
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
        });
        hostButton.addEventListener('click', sniffHostToken);
        hostButton.addEventListener('mouseenter', () => hostButton.style.transform = 'scale(1.02)');
        hostButton.addEventListener('mouseleave', () => hostButton.style.transform = 'scale(1)');
        botSection.appendChild(hostButton);

        content.appendChild(botSection);

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
            ['Shift', 'Quick hide/show'],
            ['ALT + B', 'Mass join bots'],
            ['ALT + T', 'Sniff host token']
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
        statsSection.appendChild(createStatElement('Active Bots: 0'));
        statsSection.appendChild(createStatElement('Host Token: None'));
        
        content.appendChild(statsSection);

        // Final Assembly
        contentWrapper.appendChild(content);
        uiElement.appendChild(contentWrapper);
    }

    function createSection(titleText) {
        const section = document.createElement('div');
        Object.assign(section.style, {
            backgroundColor: currentColors.secondary,
            borderRadius: '8px',
            padding: '12px',
            border: `1px solid ${currentColors.accent}`
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
            createParticles(slider, 3);
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
        el.id = 'stat-' + text.split(':')[0].toLowerCase().trim().replace(' ', '-');
        return el;
    }

    function updateStats() {
        const stats = [
            `Question: ${info.questionNum + 1}/${info.numQuestions}`,
            `Streak: ${info.streak} (Highest: ${info.highestStreak})`,
            `Correct: ${info.totalCorrect}/${info.totalAnswered} (${info.totalAnswered ? Math.round((info.totalCorrect / info.totalAnswered) * 100) : 0}%)`,
            `Active Bots: ${info.botCount}`,
            `Host Token: ${info.hostToken ? 'Captured' : 'None'}`
        ];
        
        stats.forEach(stat => {
            const id = 'stat-' + stat.split(':')[0].toLowerCase().trim().replace(' ', '-');
            const el = document.getElementById(id);
            if (el) el.textContent = stat;
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
            inputBox.style.boxShadow = 'none';
            info.numQuestions = 0;
            updateStats();
            return;
        }
        
        fetch(`https://kahoot.it/rest/kahoots/${quizID}`)
            .then(response => {
                if (!response.ok) throw new Error('Invalid');
                return response.json();
            })
            .then(data => {
                inputBox.style.backgroundColor = currentColors.correct;
                inputBox.style.boxShadow = currentColors.hoverGlow;
                questions = parseQuestions(data.questions);
                info.numQuestions = questions.length;
                updateStats();
                createParticles(inputBox, 8);
            })
            .catch(() => {
                inputBox.style.backgroundColor = currentColors.incorrect;
                inputBox.style.boxShadow = `0 0 10px ${currentColors.incorrect}`;
                info.numQuestions = 0;
                updateStats();
            });
    }

    function parseQuestions(questionsJson) {
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
            
            return q;
        });
    }

    function highlightAnswers(question) {
        if (!question) return;
        
        const answerButtons = document.querySelectorAll(
            'button[data-functional-selector^="answer-"], button[data-functional-selector^="multi-select-button-"]'
        );
        
        answerButtons.forEach(button => {
            if (button) button.style.removeProperty('background-color');
        });
        
        if (question.answers) {
            question.answers.forEach(answer => {
                const btn = FindByAttributeValue("data-functional-selector", "answer-" + answer, "button") || 
                          FindByAttributeValue("data-functional-selector", "multi-select-button-" + answer, "button");
                if (btn) btn.style.backgroundColor = currentColors.correct;
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
        
        if (settings.autoAnswer && question.answers && question.answers.length > 0) {
            const answerTime = (question.time - question.time / (500 / (settings.PPT - 500))) - settings.inputLag;
            setTimeout(() => {
                answerQuestion(question, question.answers[0]);
                info.totalAnswered++;
                info.streak++;
                if (info.streak > info.highestStreak) info.highestStreak = info.streak;
                info.totalCorrect++;
                updateStats();
            }, answerTime);
        }
    }

    function optimizePerformance() {
        clearInterval(state.mainInterval);
        state.mainInterval = setInterval(mainLoop, settings.autoAnswer ? 50 : 1000);
    }

    function mainLoop() {
        const textElement = FindByAttributeValue("data-functional-selector", "question-index-counter", "div");
        if (textElement) {
            info.questionNum = parseInt(textElement.textContent) - 1;
            updateStats();
        }
        
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
        // Create UI
        createUI();
        
        // Add CSS
        const style = document.createElement('style');
        style.textContent = `
            .kahack-ui {
                font-family: Arial, sans-serif;
            }
            input[type="range"] {
                width: 100%;
            }
            button {
                transition: background-color 0.2s;
            }
            #stat-host-token {
                color: ${currentColors.host};
                font-weight: bold;
            }
            #stat-active-bots {
                color: ${currentColors.bot};
                font-weight: bold;
            }
            .kahack-ui::-webkit-scrollbar {
                width: 6px;
            }
            .kahack-ui::-webkit-scrollbar-track {
                background: ${currentColors.primary};
            }
            .kahack-ui::-webkit-scrollbar-thumb {
                background: ${currentColors.accent};
                border-radius: 3px;
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
            
            // ALT+B - Mass join bots
            if (e.key.toLowerCase() === 'b' && e.altKey) {
                e.preventDefault();
                startMassJoin();
            }
            
            // ALT+T - Sniff host token
            if (e.key.toLowerCase() === 't' && e.altKey) {
                e.preventDefault();
                sniffHostToken();
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

        // Start main loop
        optimizePerformance();
    }

    // Start the script
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 500);
    }
})();
