// ==UserScript==
// @name         Kahoot Ultimate Suite
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Comprehensive Kahoot solution with encrypted answer handling and advanced UI
// @author       Your Name
// @match        https://kahoot.it/*
// @grant        GM_addStyle
// @run-at       document-start
// @require      https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
// ==/UserScript==

(function() {
    'use strict';
    const $ = unsafeWindow || window;
    const C = CryptoJS;

    /* ================
       CONFIGURATION
    ================= */
    const config = {
        autoAnswer: true,
        showAnswers: true,
        rainbowMode: false,
        answerDelay: 300,
        maxRetries: 5,
        debugMode: false,
        version: '3.0'
    };

    /* ================
          STATE
    ================= */
    let state = {
        ws: null,
        key: null,
        answers: [],
        question: null,
        connection: 'disconnected',
        encryption: 'pending',
        uiVisible: true,
        particles: true,
        rainbowInterval: null
    };

    /* ================
       UI CONSTANTS
    ================= */
    const colors = {
        primary: '#0d0d1a',
        secondary: '#12122b',
        accent: '#1a1a4a',
        text: '#e6e6ff',
        correct: '#00ff88',
        incorrect: '#ff3860',
        rainbow: ['#ff0080', '#ff00ff', '#8000ff', '#0033ff', '#00ffff', '#00ff80', '#80ff00'],
        particleColors: ['#00ffff', '#ff00ff', '#ffff00']
    };

    /* ================
       CORE SYSTEMS
    ================= */
    
    // WebSocket Interception
    function interceptWebSockets() {
        const NativeWS = WebSocket;
        WebSocket = function(url, protocols) {
            state.ws = new NativeWS(url, protocols);
            
            state.ws.addEventListener('message', event => {
                try {
                    const data = JSON.parse(event.data);
                    handleMessage(data);
                } catch(e) {
                    if(config.debugMode) console.error('WS Parse Error:', e);
                }
            });

            state.ws.addEventListener('open', () => updateStatus('connected'));
            state.ws.addEventListener('close', () => reconnect());
            
            return state.ws;
        };
    }

    // Message Handling
    function handleMessage(data) {
        if(data?.data?.quizQuestionAnswers) {
            processEncryptedAnswers(data.data.quizQuestionAnswers);
        }
        if(data?.data?.question) {
            state.question = data.data.question;
            processQuestion(state.question);
        }
    }

    // Encryption Handling
    async function processEncryptedAnswers(encrypted) {
        try {
            state.encryption = 'decrypting';
            if(!state.key) state.key = await findDecryptionKey();
            
            const decrypted = decryptPayload(encrypted, state.key);
            state.answers = extractAnswers(decrypted);
            updateUI();
            
            if(config.autoAnswer) scheduleAnswer();
            if(config.showAnswers) highlightAnswers();
            
            state.encryption = 'decrypted';
        } catch(e) {
            state.encryption = 'failed';
            fallbackToDOMAnalysis();
        }
    }

    // DOM Fallback System
    function fallbackToDOMAnalysis() {
        const domObserver = new MutationObserver(() => {
            const answers = detectAnswersByStyle();
            if(answers.length) {
                state.answers = answers;
                domObserver.disconnect();
                updateUI();
                if(config.autoAnswer) scheduleAnswer();
            }
        });
        
        domObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
        });
    }

    /* ================
       CRYPTO METHODS
    ================= */
    async function findDecryptionKey() {
        // Key discovery logic
        const scripts = Array.from(document.scripts);
        for(const script of scripts) {
            const key = extractKeyFromScript(script.textContent);
            if(key) return key;
        }
        return null;
    }

    function extractKeyFromScript(code) {
        const patterns = [
            /encryptionKey:\s*["']([\w+=/]+)/,
            /key:\s*["']([\w+=/]+)/,
            /secret:\s*["']([\w+=/]+)/
        ];
        
        for(const pattern of patterns) {
            const match = code.match(pattern);
            if(match) return match[1];
        }
        return null;
    }

    function decryptPayload(data, key) {
        try {
            const bytes = C.AES.decrypt(data, key);
            return JSON.parse(bytes.toString(C.enc.Utf8));
        } catch(e) {
            throw new Error('Decryption failed');
        }
    }

    /* ================
       ANSWER HANDLING
    ================= */
    function extractAnswers(data) {
        // Complex answer extraction
        if(!data) return [];
        
        return data.reduce((acc, curr, idx) => {
            if(curr?.correct) acc.push(idx);
            return acc;
        }, []);
    }

    function scheduleAnswer() {
        setTimeout(() => {
            state.answers.forEach((ans, idx) => {
                setTimeout(() => {
                    const key = (ans + 1).toString();
                    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
                }, idx * 50);
            });

            if(isMultiSelect()) {
                setTimeout(() => {
                    document.querySelector('[data-functional-selector="multi-select-submit-button"]')?.click();
                }, state.answers.length * 50 + 100);
            }
        }, config.answerDelay);
    }

    /* ================
          UI
    ================= */
    function createMainUI() {
        GM_addStyle(`
            .kahoot-ultimate-ui {
                position: fixed;
                top: 20px;
                left: 20px;
                width: 350px;
                background: ${colors.primary};
                border-radius: 10px;
                color: ${colors.text};
                font-family: Arial;
                z-index: 99999;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                border: 1px solid ${colors.accent};
            }
            .ui-header {
                padding: 12px;
                background: ${colors.secondary};
                cursor: move;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-radius: 10px 10px 0 0;
            }
            .ui-section {
                padding: 15px;
                border-bottom: 1px solid ${colors.accent};
            }
            .toggle-container {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
            }
            .rainbow-slider {
                width: 100%;
                margin: 15px 0;
            }
        `);

        const ui = document.createElement('div');
        ui.className = 'kahoot-ultimate-ui';
        
        ui.innerHTML = `
            <div class="ui-header">
                <h2>Kahoot Ultimate v${config.version}</h2>
                <div class="controls">
                    <button id="minimize">−</button>
                    <button id="close">×</button>
                </div>
            </div>
            <div class="ui-section" id="status">
                <h3>System Status</h3>
                <div>Connection: <span id="conn-status">${state.connection}</span></div>
                <div>Encryption: <span id="enc-status">${state.encryption}</span></div>
                <div>Answers Found: <span id="ans-count">0</span></div>
            </div>
            <div class="ui-section" id="controls">
                <h3>Controls</h3>
                <div class="toggle-container">
                    <label>Auto Answer</label>
                    <input type="checkbox" id="auto-answer" ${config.autoAnswer ? 'checked' : ''}>
                </div>
                <div class="toggle-container">
                    <label>Show Answers</label>
                    <input type="checkbox" id="show-answers" ${config.showAnswers ? 'checked' : ''}>
                </div>
                <div class="toggle-container">
                    <label>Rainbow Mode</label>
                    <input type="checkbox" id="rainbow-mode" ${config.rainbowMode ? 'checked' : ''}>
                </div>
                <input type="range" class="rainbow-slider" min="50" max="1000" value="300">
            </div>
        `;

        document.body.appendChild(ui);
        setupUIControls(ui);
        setupDrag(ui);
        return ui;
    }

    function updateUI() {
        document.getElementById('conn-status').textContent = state.connection;
        document.getElementById('enc-status').textContent = state.encryption;
        document.getElementById('ans-count').textContent = state.answers.length;
    }

    /* ================
       UI CONTROLS
    ================= */
    function setupUIControls(ui) {
        ui.querySelector('#auto-answer').addEventListener('change', e => {
            config.autoAnswer = e.target.checked;
        });
        
        ui.querySelector('#show-answers').addEventListener('change', e => {
            config.showAnswers = e.target.checked;
            if(!config.showAnswers) clearHighlights();
        });
        
        ui.querySelector('#rainbow-mode').addEventListener('change', e => {
            config.rainbowMode = e.target.checked;
            if(config.rainbowMode) startRainbow();
            else stopRainbow();
        });
        
        ui.querySelector('.rainbow-slider').addEventListener('input', e => {
            config.rainbowSpeed = e.target.value;
            if(config.rainbowMode) startRainbow();
        });
    }

    function setupDrag(ui) {
        let isDragging = false;
        let offset = [0, 0];
        
        ui.querySelector('.ui-header').addEventListener('mousedown', e => {
            isDragging = true;
            offset = [
                ui.offsetLeft - e.clientX,
                ui.offsetTop - e.clientY
            ];
        });

        document.addEventListener('mousemove', e => {
            if(isDragging) {
                ui.style.left = (e.clientX + offset[0]) + 'px';
                ui.style.top = (e.clientY + offset[1]) + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    /* ================
       VISUAL EFFECTS
    ================= */
    function highlightAnswers() {
        document.querySelectorAll('[data-functional-selector^="answer-"]').forEach((btn, idx) => {
            if(state.answers.includes(idx)) {
                btn.style.backgroundColor = colors.correct;
            }
        });
    }

    function clearHighlights() {
        document.querySelectorAll('[data-functional-selector^="answer-"]').forEach(btn => {
            btn.style.backgroundColor = '';
        });
    }

    function startRainbow() {
        state.rainbowInterval = setInterval(() => {
            document.querySelectorAll('[data-functional-selector^="answer-"]').forEach(btn => {
                const color = colors.rainbow[Math.floor(Math.random() * colors.rainbow.length)];
                btn.style.backgroundColor = color;
            });
        }, config.rainbowSpeed || 300);
    }

    function stopRainbow() {
        clearInterval(state.rainbowInterval);
        state.rainbowInterval = null;
        clearHighlights();
    }

    /* ================
       UTILITIES
    ================= */
    function isMultiSelect() {
        return document.querySelector('[data-functional-selector*="multi-select-button-"]');
    }

    function updateStatus(status) {
        state.connection = status;
        updateUI();
    }

    function reconnect() {
        updateStatus('reconnecting');
        setTimeout(interceptWebSockets, 2000);
    }

    function detectAnswersByStyle() {
        return Array.from(document.querySelectorAll('[data-functional-selector^="answer-"]'))
            .map(btn => {
                const style = getComputedStyle(btn);
                return style.backgroundColor === 'rgb(79, 113, 235)';
            })
            .map((correct, idx) => correct ? idx : -1)
            .filter(i => i !== -1);
    }

    /* ================
       INITIALIZATION
    ================= */
    function init() {
        interceptWebSockets();
        createMainUI();
        setupKeybinds();
        autoReconnect();
    }

    function setupKeybinds() {
        document.addEventListener('keydown', e => {
            if(e.altKey) {
                switch(e.key.toLowerCase()) {
                    case 'w': scheduleAnswer(); break;
                    case 's': highlightAnswers(); break;
                    case 'r': startRainbow(); break;
                    case 'h': toggleUI(); break;
                }
            }
        });
    }

    function toggleUI() {
        state.uiVisible = !state.uiVisible;
        document.querySelector('.kahoot-ultimate-ui').style.display = 
            state.uiVisible ? 'block' : 'none';
    }

    function autoReconnect() {
        setInterval(() => {
            if(!document.querySelector('[data-functional-selector="nickname"]')) return;
            const input = document.querySelector('input');
            const button = document.querySelector('button');
            if(input && button && !input.value) {
                input.value = `Player${Math.floor(Math.random() * 1000)}`;
                button.click();
            }
        }, 3000);
    }

    /* ================
       START
    ================= */
    init();
})();
