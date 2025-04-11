// ==UserScript==
// @name         Kahoot Ultimate Solution
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Fixed version with proper error handling
// @author       Your Name
// @match        https://kahoot.it/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const config = {
        autoAnswer: true,
        showAnswers: true,
        answerDelay: 300,
        version: '3.1'
    };

    // State Management
    let state = {
        answers: [],
        question: null,
        uiInitialized: false,
        elements: {
            status: null,
            answersCount: null,
            connection: null
        }
    };

    // UI Creation
    function initializeUI() {
        GM_addStyle(`
            .kahoot-ui {
                position: fixed;
                top: 20px;
                left: 20px;
                background: #1a1a2e;
                color: #fff;
                padding: 15px;
                border-radius: 8px;
                font-family: Arial;
                z-index: 99999;
            }
            .status-item {
                margin: 10px 0;
            }
        `);

        const ui = document.createElement('div');
        ui.className = 'kahoot-ui';
        ui.innerHTML = `
            <div class="status-item">
                <strong>Connection:</strong> <span id="kahoot-conn-status">Loading...</span>
            </div>
            <div class="status-item">
                <strong>Answers Found:</strong> <span id="kahoot-ans-count">0</span>
            </div>
        `;

        document.body.appendChild(ui);
        state.elements.connection = document.getElementById('kahoot-conn-status');
        state.elements.answersCount = document.getElementById('kahoot-ans-count');
        state.uiInitialized = true;
    }

    // Safe UI Updates
    function updateUI() {
        if (!state.uiInitialized) return;

        const safeUpdate = (element, text) => {
            if (element && element.textContent !== text) {
                element.textContent = text;
            }
        };

        safeUpdate(state.elements.connection, state.connectionStatus || 'Disconnected');
        safeUpdate(state.elements.answersCount, state.answers.length.toString());
    }

    // WebSocket Handling
    function setupWebSocket() {
        const NativeWebSocket = WebSocket;
        WebSocket = function(url, protocols) {
            const ws = new NativeWebSocket(url, protocols);

            ws.addEventListener('message', (event) => {
                try {
                    handleMessage(JSON.parse(event.data));
                } catch (error) {
                    console.error('Message handling error:', error);
                }
            });

            ws.addEventListener('open', () => {
                state.connectionStatus = 'Connected';
                updateUI();
            });

            ws.addEventListener('close', () => {
                state.connectionStatus = 'Reconnecting...';
                updateUI();
                setTimeout(setupWebSocket, 2000);
            });

            return ws;
        };
    }

    // Core Logic
    function handleMessage(data) {
        if (!data || !data.data) return;

        // Answer extraction logic
        if (data.data.quizQuestionAnswers) {
            state.answers = data.data.quizQuestionAnswers
                .map((answer, index) => answer.correct ? index : -1)
                .filter(index => index !== -1);
            updateUI();
        }

        // Auto-answer logic
        if (config.autoAnswer && state.answers.length > 0) {
            setTimeout(() => {
                state.answers.forEach((answerIndex) => {
                    const key = (answerIndex + 1).toString();
                    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
                });
            }, config.answerDelay);
        }
    }

    // Initialization
    function init() {
        initializeUI();
        setupWebSocket();
        
        // Ensure UI exists before updates
        document.addEventListener('DOMContentLoaded', () => {
            if (!state.uiInitialized) initializeUI();
        });

        // Fallback detection
        setInterval(() => {
            if (state.answers.length === 0) {
                const buttons = Array.from(document.querySelectorAll('[data-functional-selector^="answer-"]'));
                state.answers = buttons
                    .map(btn => getComputedStyle(btn).backgroundColor === 'rgb(79, 113, 235)')
                    .map((correct, index) => correct ? index : -1)
                    .filter(i => i !== -1);
                if (state.answers.length > 0) updateUI();
            }
        }, 1000);
    }

    // Start the script
    init();
})();
