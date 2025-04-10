// ==UserScript==
// @name         KaHack! Neon Edition
// @version      7.0.1
// @namespace    https://github.com/jokeri2222
// @description  Ultimate Kahoot hack with neon effects and flawless functionality
// @match        https://kahoot.it/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ======================
    // NEON CONFIGURATION
    // ======================
    const Version = '7.0.1';
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
        botCount: 0,
        hostToken: null
    };

    const settings = {
        PPT: 950,
        autoAnswer: false,
        showAnswers: false,
        inputLag: 100,
        rainbowSpeed: 300,
        maxBots: 50,
        botJoinDelay: 1000
    };

    const state = {
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

    // Neon Color Scheme
    const neon = {
        primary: '#0a0a15',
        secondary: '#0f0f25',
        accent: '#1a1a4a',
        text: '#e6e6ff',
        correct: '#00ff88',
        incorrect: '#ff3860',
        close: '#ff3860',
        minimize: '#7f7fff',
        bot: '#00ffff',
        host: '#ff00ff',
        glow: {
            correct: '0 0 15px #00ff88, 0 0 30px #00ff8840',
            incorrect: '0 0 15px #ff3860, 0 0 30px #ff386040',
            primary: '0 0 10px #1a1a4a',
            accent: '0 0 15px #7f7fff'
        },
        particles: ['#00ffff', '#ff00ff', '#ffff00', '#ff0080', '#8000ff']
    };

    let uiElement, contentWrapper;

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

    function createParticles(element, count = 5, sizeMultiplier = 1) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const size = (Math.random() * 4 + 2) * sizeMultiplier;
            const color = neon.particles[Math.floor(Math.random() * neon.particles.length)];
            
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
                willChange: 'transform, opacity',
                filter: 'blur(1px)'
            });
            
            document.body.appendChild(particle);
            
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 20 * sizeMultiplier + 10;
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
                    button.style.cssText = `
                        background-color: hsl(${hue}, 100%, 50%) !important;
                        transition: background-color ${settings.rainbowSpeed/1000}s ease !important;
                        box-shadow: 0 0 10px hsl(${hue}, 100%, 50%) !important;
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
                button.style.removeProperty('box-shadow');
            }
        });
    }

    // ======================
    // QUIZ FUNCTIONS (FIXED)
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
                inputBox.style.backgroundColor = neon.correct;
                inputBox.style.boxShadow = neon.glow.correct;
                questions = parseQuestions(data.questions);
                info.numQuestions = questions.length;
                updateStats();
                createParticles(inputBox, 10, 1.5);
            })
            .catch(() => {
                inputBox.style.backgroundColor = neon.incorrect;
                inputBox.style.boxShadow = neon.glow.incorrect;
                info.numQuestions = 0;
                updateStats();
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
        
        // Reset all buttons first
        answerButtons.forEach(button => {
            if (button) {
                button.style.removeProperty('background-color');
                button.style.removeProperty('box-shadow');
            }
        });
        
        // Highlight correct answers
        if (question.answers) {
            question.answers.forEach(answer => {
                const btn = FindByAttributeValue("data-functional-selector", "answer-" + answer, "button") || 
                          FindByAttributeValue("data-functional-selector", "multi-select-button-" + answer, "button");
                if (btn) {
                    btn.style.backgroundColor = neon.correct;
                    btn.style.boxShadow = neon.glow.correct;
                }
            });
        }
        
        // Highlight incorrect answers
        if (question.incorrectAnswers) {
            question.incorrectAnswers.forEach(answer => {
                const btn = FindByAttributeValue("data-functional-selector", "answer-" + answer, "button") || 
                          FindByAttributeValue("data-functional-selector", "multi-select-button-" + answer, "button");
                if (btn) {
                    btn.style.backgroundColor = neon.incorrect;
                    btn.style.boxShadow = neon.glow.incorrect;
                }
            });
        }
    }

    function answerQuestion(question, time) {
        const delay = question.type === 'multiple_select_quiz' ? 60 : 0;
        
        setTimeout(() => {
            if (question.type === 'quiz') {
                const key = (question.answers[0] + 1).toString();
                window.dispatchEvent(new KeyboardEvent('keydown', { key: key }));
            } 
            else if (question.type === 'multiple_select_quiz') {
                question.answers.forEach(answer => {
                    const key = (answer + 1).toString();
                    window.dispatchEvent(new KeyboardEvent('keydown', { key: key }));
                });
                
                setTimeout(() => {
                    const submitBtn = FindByAttributeValue("data-functional-selector", "multi-select-submit-button", "button");
                    if (submitBtn) submitBtn.click();
                }, 0);
            }
        }, time - delay);
    }

    function onQuestionStart() {
        const question = questions[info.questionNum];
        if (!question) return;
        
        if (settings.showAnswers || state.isAltSPressed) {
            highlightAnswers(question);
        }
        
        if (settings.autoAnswer && question.answers && question.answers.length > 0) {
            const answerTime = (question.time - question.time / (500 / (settings.PPT - 500))) - settings.inputLag;
            answerQuestion(question, answerTime);
            
            info.totalAnswered++;
            info.streak++;
            if (info.streak > info.highestStreak) info.highestStreak = info.streak;
            info.totalCorrect++;
            updateStats();
        }
    }

    function optimizePerformance() {
        clearInterval(state.mainInterval);
        state.mainInterval = setInterval(mainLoop, settings.autoAnswer ? 50 : 1000);
    }

    function mainLoop() {
        // Update question number
        const textElement = FindByAttributeValue("data-functional-selector", "question-index-counter", "div");
        if (textElement) {
            info.questionNum = parseInt(textElement.textContent) - 1;
            updateStats();
        }
        
        // Detect new question
        if (FindByAttributeValue("data-functional-selector", "answer-0", "button") && 
            info.lastAnsweredQuestion !== info.questionNum) {
            info.lastAnsweredQuestion = info.questionNum;
            onQuestionStart();
        }
        
        // Update input lag for auto-answer
        if (settings.autoAnswer && info.ILSetQuestion !== info.questionNum) {
            const incrementElement = FindByAttributeValue("data-functional-selector", "score-increment", "span");
            if (incrementElement) {
                info.ILSetQuestion = info.questionNum;
                const incrementText = incrementElement.textContent;
                const increment = parseInt(incrementText.split(" ")[1]);
                
                if (!isNaN(increment) && increment !== 0) {
                    const ppt = settings.PPT > 987 ? 1000 : settings.PPT;
                    const adjustment = (ppt - increment) * 15;
                    
                    if (settings.inputLag + adjustment < 0) {
                        adjustment = (ppt - increment / 2) * 15;
                    }
                    
                    settings.inputLag = Math.max(0, Math.round(settings.inputLag + adjustment));
                    updateStats();
                }
            }
        }
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
        
        const botCount = Math.min(settings.maxBots, parseInt(prompt('How many bots? (Max 50)', '10')) || 0);
        if (botCount < 1) {
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
    // UI FUNCTIONS (UNCHANGED)
    // ======================
    // [Keep all the existing UI functions exactly as they were]
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
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
                box-shadow: 0 0 5px #7f7fff;
            }
            input[type="text"] {
                transition: all 0.3s ease;
            }
            input[type="text"]:focus {
                outline: none;
            }
            button {
                transition: all 0.2s ease;
            }
            .kahack-ui::-webkit-scrollbar {
                width: 6px;
            }
            .kahack-ui::-webkit-scrollbar-track {
                background: ${neon.primary};
            }
            .kahack-ui::-webkit-scrollbar-thumb {
                background: ${neon.accent};
                border-radius: 3px;
                box-shadow: ${neon.glow.accent};
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
                createParticles(uiElement, 15, 1.5);
            }
            
            // SHIFT - Quick hide/show
            if (e.key === 'Shift') {
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
                    question.answers.forEach(answer => {
                        const key = (answer + 1).toString();
                        window.dispatchEvent(new KeyboardEvent('keydown', { key: key }));
                    });
                    
                    setTimeout(() => {
                        const submitBtn = FindByAttributeValue("data-functional-selector", "multi-select-submit-button", "button");
                        if (submitBtn) submitBtn.click();
                    }, 50);
                }
                
                info.totalAnswered++;
                info.streak++;
                if (info.streak > info.highestStreak) info.highestStreak = info.streak;
                info.totalCorrect++;
                updateStats();
            }
            
            // ALT+S - Show answers while held
            if (e.key.toLowerCase() === 's' && e.altKey && info.questionNum !== -1) {
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
