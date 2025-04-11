// ==UserScript==
// @name         KaHack! Real-Time Edition
// @version      2.0
// @namespace    https://github.com/jokeri2222
// @description  Kahoot hack with live answer detection
// @match        https://kahoot.it/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kahoot.it
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const Version = '2.0';
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

    // Answer detection system
    let answerState = {
        currentQuestion: -1,
        correctAnswers: [],
        questionType: 'quiz',
        lastDetected: 0
    };

    // Colors
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
// Add this function BEFORE it's used in the code
function createSection(titleText) {
    const section = document.createElement('div');
    Object.assign(section.style, {
        backgroundColor: colors.secondary,
        borderRadius: '8px',
        padding: '12px',
        border: `1px solid ${colors.accent}`,
        transition: 'transform 0.2s ease'
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

// Then proceed with creating the UI sections
const detectionSection = createSection('LIVE DETECTION');
// ... rest of your UI code ...
    // Helper functions
    function createParticles(element, count = 5) {
        // Keep existing particle implementation
    }

    function startRainbowEffect() {
        // Keep existing rainbow implementation
    }

    function stopRainbowEffect() {
        // Keep existing rainbow implementation
    }

    // New Answer Detection System
    function detectAnswers() {
        const newState = {
            currentQuestion: -1,
            correctAnswers: [],
            questionType: 'quiz'
        };

        // Get current question number
        const questionCounter = document.querySelector('[data-functional-selector="question-index-counter"]');
        if(questionCounter) {
            newState.currentQuestion = parseInt(questionCounter.textContent) - 1;
        }

        // Detect answer buttons
        const answerButtons = document.querySelectorAll(
            'button[data-functional-selector^="answer-"], ' +
            'button[data-functional-selector^="multi-select-button-"]'
        );

        answerButtons.forEach(button => {
            const style = window.getComputedStyle(button);
            const isCorrect = style.backgroundColor === 'rgb(79, 113, 235)' || 
                            style.borderColor === 'rgb(79, 113, 235)';
            
            if(isCorrect) {
                const answerNum = parseInt(button.dataset.functionalSelector.match(/\d+/)[0]);
                newState.correctAnswers.push(answerNum);
            }
        });

        // Detect question type
        if(document.querySelector('[data-functional-selector*="multi-select-button-"]')) {
            newState.questionType = 'multiple_select_quiz';
        }

        // Update state if new question detected
        if(newState.currentQuestion !== answerState.currentQuestion) {
            answerState = newState;
            answerState.lastDetected = Date.now();
            updateUIInfo();
        }
    }

    // Modified UI (Quiz ID Section Removed)
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

    // Keep existing UI structure but remove Quiz ID section
    // [Rest of UI code remains the same, except:]

    // Replace Quiz ID section with Detection Info
    const detectionSection = createSection('LIVE DETECTION');
    const detectionInfo = document.createElement('div');
    detectionInfo.innerHTML = `
        <div style="color: ${colors.text}; font-size: 14px; line-height: 1.4;">
            <div>Status: <span id="kahack-status">Scanning...</span></div>
            <div>Question Type: <span id="kahack-qtype">-</span></div>
            <div>Detected Answers: <span id="kahack-answers">-</span></div>
        </div>
    `;
    detectionSection.body.appendChild(detectionInfo);
    content.insertBefore(detectionSection.section, content.firstChild);

    function updateUIInfo() {
        const statusElement = document.getElementById('kahack-status');
        const qtypeElement = document.getElementById('kahack-qtype');
        const answersElement = document.getElementById('kahack-answers');
        
        if(statusElement) statusElement.textContent = 
            answerState.currentQuestion > -1 ? 'Active' : 'Waiting...';
        if(qtypeElement) qtypeElement.textContent = 
            answerState.questionType.replace(/_/g, ' ').toUpperCase();
        if(answersElement) answersElement.textContent = 
            answerState.correctAnswers.map(a => a + 1).join(', ') || 'None';
    }

    // Modified Answer Submission
    function submitAnswers() {
        if(answerState.correctAnswers.length === 0) return;

        const delay = 50;
        answerState.correctAnswers.forEach((answer, index) => {
            setTimeout(() => {
                const key = (answer + 1).toString();
                window.dispatchEvent(new KeyboardEvent('keydown', { key }));
            }, index * delay);
        });

        if(answerState.questionType === 'multiple_select_quiz') {
            setTimeout(() => {
                const submitBtn = document.querySelector(
                    '[data-functional-selector="multi-select-submit-button"]'
                );
                if(submitBtn) submitBtn.click();
            }, answerState.correctAnswers.length * delay + 50);
        }
    }

    // WebSocket Interception
    const originalWebSocket = window.WebSocket;
    window.WebSocket = function(url, protocols) {
        const ws = new originalWebSocket(url, protocols);

        ws.addEventListener('message', function(event) {
            try {
                const data = JSON.parse(event.data);
                if(data?.data?.correctAnswers) {
                    answerState.correctAnswers = data.data.correctAnswers;
                    updateUIInfo();
                }
            } catch(e) {
                // Silent error handling
            }
        });

        return ws;
    };

    // Main interval
    setInterval(() => {
        detectAnswers();
        if(autoAnswer) {
            const answerDelay = Math.max(0, 
                (answerState.lastDetected + inputLag) - Date.now()
            );
            setTimeout(submitAnswers, answerDelay);
        }
        updateUIInfo();
    }, 500);

    // Keep remaining original code (UI interactions, particles, etc)
    // Remove all quiz ID related code including:
    // - handleInputChange function
    // - Quiz ID input field
    // - parseQuestions function
    // - fetch calls for quiz data

})();
