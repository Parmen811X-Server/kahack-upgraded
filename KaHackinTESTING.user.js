// ==UserScript==
// @name         KaHack! Ultimate Enhanced
// @version      5.0.0
// @namespace    https://github.com/jokeri2222
// @description  The most powerful Kahoot hack with all features preserved and enhanced
// @match        https://kahoot.it/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ======================
    // CORE CONFIGURATION
    // ======================
    const Version = '5.0.0';
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
        language: 'en',
        answerPattern: 'default',
        answerSpeed: 50,
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

    // ======================
    // PRESERVED CORE FUNCTIONS
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
        playSound('rainbow');
    }

    function stopRainbowEffect() {
        if (state.rainbowInterval) {
            clearInterval(state.rainbowInterval);
            state.rainbowInterval = null;
        }
        resetAnswerColors();
    }

    // ======================
    // ENHANCED FEATURES
    // ======================

    // 1. AUTO-JOIN GAME SYSTEM
    function setupAutoJoin() {
        if (!settings.autoJoin.enabled) return;
        
        const joinInterval = setInterval(() => {
            if (window.location.href.includes('join')) {
                const pinField = document.querySelector('input[aria-label="Game PIN"]');
                const nameField = document.querySelector('input[aria-label="Nickname"]');
                const joinButton = document.querySelector('button[aria-label="Enter"]');
                
                if (pinField && nameField && joinButton) {
                    pinField.value = settings.autoJoin.pin;
                    nameField.value = settings.autoJoin.nickname;
                    joinButton.click();
                    clearInterval(joinInterval);
                }
            }
        }, 500);
    }

    // 2. ANSWER HISTORY TRACKER
    function trackAnswer(questionText, selectedIndex, wasCorrect, pointsEarned) {
        state.answerHistory.push({
            question: questionText,
            selectedIndex,
            wasCorrect,
            points: pointsEarned,
            timestamp: new Date(),
            questionNum: info.questionNum
        });
        
        if (wasCorrect) {
            info.streak++;
            info.totalCorrect++;
            if (info.streak > info.highestStreak) info.highestStreak = info.streak;
            state.sessionStats.pointsEarned += pointsEarned;
        } else {
            state.sessionStats.streaks.push(info.streak);
            info.streak = 0;
        }
        info.totalAnswered++;
    }

    // 3. SMART ANSWER PREDICTION
    function predictAnswers() {
        if (!questions.length || info.questionNum < 0) return null;
        
        const currentQuestion = questions[info.questionNum];
        if (!currentQuestion || !currentQuestion.answers) return null;
        
        // Pattern recognition - check if answers follow a sequence
        if (info.questionNum > 2) {
            const prevAnswers = state.answerHistory.slice(-3);
            if (prevAnswers.length === 3 && 
                prevAnswers[0].wasCorrect && 
                prevAnswers[1].wasCorrect && 
                prevAnswers[2].wasCorrect) {
                const lastPattern = prevAnswers[2].selectedIndex - prevAnswers[1].selectedIndex;
                const predictedIndex = prevAnswers[2].selectedIndex + lastPattern;
                if (predictedIndex >= 0 && predictedIndex < 4) {
                    return {
                        predictedAnswer: predictedIndex,
                        confidence: 0.85,
                        method: 'pattern-recognition'
                    };
                }
            }
        }
        
        // Default to first correct answer if available
        return {
            predictedAnswer: currentQuestion.answers[0],
            confidence: 0.95,
            method: 'correct-answer'
        };
    }

    // 4. PERFORMANCE OPTIMIZER
    function optimizePerformance() {
        clearInterval(state.mainInterval);
        
        const delay = settings.stealthMode ? 
            Math.floor(Math.random() * 200) + 50 : // Random delay in stealth mode
            (settings.autoAnswer ? 50 : 1000); // Frequent checks when auto-answering
        
        state.mainInterval = setInterval(mainLoop, delay);
    }

    // 5. ENHANCED STEALTH MODE
    function enableStealthMode(enable) {
        settings.stealthMode = enable;
        
        if (enable) {
            // Hide all script traces
            Object.defineProperty(window, 'KahootHack', {
                value: {},
                writable: false,
                configurable: false,
                enumerable: false
            });
            
            // Randomize timing patterns
            optimizePerformance();
            
            // Disable obvious features
            stopRainbowEffect();
        }
        
        updateUI();
    }

    // ======================
    // CORE FUNCTIONALITY
    // ======================

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
        
        if (question.incorrectAnswers) {
            question.incorrectAnswers.forEach(answer => {
                const btn = FindByAttributeValue("data-functional-selector", "answer-" + answer, "button") || 
                          FindByAttributeValue("data-functional-selector", "multi-select-button-" + answer, "button");
                if (btn) btn.style.backgroundColor = currentColors.incorrect;
            });
        }
    }

    function answerQuestion(question, answerIndex) {
        const key = (answerIndex + 1).toString();
        window.dispatchEvent(new KeyboardEvent('keydown', { key }));
        
        // For multi-select questions
        if (question.type === 'multiple_select_quiz') {
            setTimeout(() => {
                const submitBtn = FindByAttributeValue("data-functional-selector", "multi-select-submit-button", "button");
                if (submitBtn) submitBtn.click();
            }, 50);
        }
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
        
        // Auto-answer logic
        if (settings.autoAnswer && info.questionNum !== -1) {
            const question = questions[info.questionNum];
            if (question) {
                const answerTime = (question.time - question.time / (500 / (settings.PPT - 500))) - settings.inputLag;
                setTimeout(() => {
                    const prediction = predictAnswers();
                    const answerIndex = prediction ? prediction.predictedAnswer : question.answers[0];
                    answerQuestion(question, answerIndex);
                }, answerTime);
            }
        }
    }

    // ======================
    // INITIALIZATION
    // ======================

    function init() {
        createUI();
        setupAutoJoin();
        optimizePerformance();
        updateUI();
        
        if (document.body) {
            document.body.appendChild(uiElement);
        } else {
            window.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(uiElement);
            });
        }
    }

    // Start the script
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 500);
    }

})();
