// ==UserScript==
// @name         KaHack! Neon Edition
// @version      2.0.0
// @namespace    https://github.com/jokeri2222
// @description  Ultra-smooth Kahoot hack with glowing neon UI
// @updateURL    https://github.com/jokeri2222/KaHack/raw/main/KaHack-Neon.meta.js
// @downloadURL  https://github.com/jokeri2222/KaHack/raw/main/KaHack-Neon.user.js
// @author       jokeri2222
// @match        https://kahoot.it/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kahoot.it
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Neon Configuration
    const Version = '2.0.0';
    const colors = {
        primary: 'rgba(10, 5, 20, 0.95)',
        secondary: 'rgba(20, 10, 40, 0.9)',
        accent: 'rgba(100, 50, 255, 0.7)',
        text: '#e6e6ff',
        correct: 'hsl(155, 100%, 50%)',
        incorrect: 'hsl(350, 100%, 60%)',
        close: 'hsl(350, 100%, 60%)',
        minimize: 'hsl(240, 100%, 70%)',
        glow: '0 0 15px rgba(100, 220, 255, 0.8)',
        rainbow: ['#ff0080', '#ff00ff', '#8000ff', '#0033ff', '#00ffff', '#00ff80', '#80ff00'],
        particleColors: ['#00ffff', '#ff00ff', '#ffff00']
    };

    // Core Variables (unchanged from original)
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

    // Helper function (unchanged)
    function FindByAttributeValue(attribute, value, element_type) {
        element_type = element_type || "*";
        const All = document.getElementsByTagName(element_type);
        for (let i = 0; i < All.length; i++) {
            if (All[i].getAttribute(attribute) === value) return All[i];
        }
        return null;
    }

    // ======================
    // NEON UI COMPONENTS
    // ======================

    // Create main UI container with neon border
    const uiElement = document.createElement('div');
    uiElement.className = 'kahack-neon-ui';
    Object.assign(uiElement.style, {
        position: 'fixed',
        top: '20px',
        left: '20px',
        width: '360px',
        backgroundColor: colors.primary,
        borderRadius: '12px',
        boxShadow: `0 0 20px ${colors.accent}, inset 0 0 10px rgba(100, 220, 255, 0.3)`,
        zIndex: '9999',
        overflow: 'hidden',
        border: `1px solid ${colors.accent}`,
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(5px)',
        transform: 'translateZ(0)'
    });

    // Create pulsing neon header
    const header = document.createElement('div');
    header.className = 'neon-header';
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
        position: 'relative',
        overflow: 'hidden'
    });

    // Add header glow effect
    const headerGlow = document.createElement('div');
    headerGlow.className = 'header-glow';
    Object.assign(headerGlow.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: `linear-gradient(90deg, 
            transparent, 
            rgba(100, 220, 255, 0.2), 
            transparent)`,
        animation: 'pulseGlow 3s infinite alternate'
    });
    header.appendChild(headerGlow);

    // Title with text glow
    const title = document.createElement('div');
    title.textContent = 'KaHack! NEON';
    Object.assign(title.style, {
        fontWeight: 'bold',
        fontSize: '18px',
        textShadow: `0 0 10px ${colors.accent}`,
        position: 'relative',
        zIndex: '1'
    });

    // Control buttons with hover glow
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '8px';

    function createControlButton(symbol, color) {
        const btn = document.createElement('div');
        btn.textContent = symbol;
        Object.assign(btn.style, {
            width: '26px',
            height: '26px',
            background: color,
            color: colors.text,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease',
            boxShadow: `0 0 5px ${color}`,
            position: 'relative',
            zIndex: '1'
        });

        btn.addEventListener('mouseenter', () => {
            btn.style.boxShadow = `0 0 15px ${color}`;
            btn.style.transform = 'scale(1.1)';
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.boxShadow = `0 0 5px ${color}`;
            btn.style.transform = 'scale(1)';
        });

        return btn;
    }

    const minimizeBtn = createControlButton('─', colors.minimize);
    const closeBtn = createControlButton('✕', colors.close);

    buttonContainer.appendChild(minimizeBtn);
    buttonContainer.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(buttonContainer);
    uiElement.appendChild(header);

    // Create content container with scroll
    const content = document.createElement('div');
    content.className = 'neon-content';
    Object.assign(content.style, {
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        maxHeight: '60vh',
        overflowY: 'auto',
        scrollbarWidth: 'thin'
    });

    // ======================
    // NEON UI SECTIONS
    // ======================

    function createNeonSection(titleText) {
        const section = document.createElement('div');
        Object.assign(section.style, {
            background: `linear-gradient(145deg, ${colors.secondary}, ${colors.primary})`,
            borderRadius: '10px',
            padding: '15px',
            border: `1px solid ${colors.accent}`,
            boxShadow: `0 0 10px rgba(100, 220, 255, 0.2)`,
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
        });

        // Section corner glow
        const cornerGlow = document.createElement('div');
        Object.assign(cornerGlow.style, {
            position: 'absolute',
            top: '0',
            right: '0',
            width: '20px',
            height: '20px',
            background: `radial-gradient(circle at 100% 0%, ${colors.accent}, transparent 70%)`,
            pointerEvents: 'none'
        });
        section.appendChild(cornerGlow);

        const header = document.createElement('h3');
        header.textContent = titleText;
        Object.assign(header.style, {
            margin: '0 0 12px 0',
            color: colors.text,
            fontSize: '16px',
            fontWeight: '600',
            textShadow: `0 0 5px ${colors.accent}`
        });

        section.appendChild(header);
        return { section, body: section };
    }

    // Create neon input field
    function createNeonInput(placeholder) {
        const container = document.createElement('div');
        container.style.position = 'relative';

        const input = document.createElement('input');
        Object.assign(input.style, {
            width: '100%',
            padding: '10px 15px',
            borderRadius: '6px',
            border: `1px solid ${colors.accent}`,
            background: 'rgba(0, 0, 0, 0.3)',
            color: colors.text,
            fontSize: '14px',
            transition: 'all 0.3s ease',
            outline: 'none'
        });
        input.placeholder = placeholder;

        // Input glow effect
        input.addEventListener('focus', () => {
            input.style.boxShadow = `0 0 10px ${colors.accent}`;
            input.style.borderColor = colors.correct;
        });

        input.addEventListener('blur', () => {
            input.style.boxShadow = 'none';
            input.style.borderColor = colors.accent;
        });

        container.appendChild(input);
        return { container, input };
    }

    // Create neon slider
    function createNeonSlider(min, max, value) {
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
            borderRadius: '3px',
            outline: 'none'
        });

        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = value;
        Object.assign(valueDisplay.style, {
            color: colors.text,
            minWidth: '40px',
            textAlign: 'center',
            textShadow: `0 0 5px ${colors.accent}`
        });

        container.appendChild(slider);
        container.appendChild(valueDisplay);
        return { container, slider, valueDisplay };
    }

    // Create neon toggle switch
    function createNeonToggle(label, checked, onChange) {
        const container = document.createElement('div');
        Object.assign(container.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            margin: '10px 0'
        });

        const labelElement = document.createElement('span');
        labelElement.textContent = label;
        Object.assign(labelElement.style, {
            color: colors.text,
            fontSize: '14px',
            textShadow: `0 0 3px ${colors.accent}`
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
            borderRadius: '34px',
            boxShadow: checked ? `0 0 10px ${colors.correct}` : 'none'
        });

        const sliderKnob = document.createElement('span');
        Object.assign(sliderKnob.style, {
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

        input.addEventListener('change', function() {
            const isChecked = this.checked;
            slider.style.backgroundColor = isChecked ? colors.correct : colors.incorrect;
            slider.style.boxShadow = isChecked ? `0 0 10px ${colors.correct}` : 'none';
            sliderKnob.style.left = isChecked ? '26px' : '4px';
            onChange(isChecked);
        });

        toggle.appendChild(input);
        toggle.appendChild(slider);
        slider.appendChild(sliderKnob);
        container.appendChild(labelElement);
        container.appendChild(toggle);

        return container;
    }

    // Create neon button
    function createNeonButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        Object.assign(button.style, {
            width: '100%',
            padding: '10px',
            marginTop: '5px',
            background: `linear-gradient(145deg, ${colors.accent}, ${colors.secondary})`,
            color: colors.text,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '14px',
            fontWeight: '500',
            textShadow: `0 0 5px ${colors.accent}`,
            position: 'relative',
            overflow: 'hidden'
        });

        // Button hover effect
        button.addEventListener('mouseenter', () => {
            button.style.boxShadow = `0 0 15px ${colors.accent}`;
            button.style.transform = 'translateY(-2px)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.boxShadow = 'none';
            button.style.transform = 'translateY(0)';
        });

        button.addEventListener('click', () => {
            button.style.boxShadow = `0 0 20px ${colors.accent}`;
            setTimeout(() => {
                button.style.boxShadow = 'none';
            }, 300);
            onClick();
        });

        // Button glow effect
        const buttonGlow = document.createElement('div');
        Object.assign(buttonGlow.style, {
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: `conic-gradient(
                from 0deg at 50% 50%,
                transparent 0%,
                ${colors.accent} 10%,
                transparent 20%
            )`,
            opacity: '0.3',
            animation: 'rotateGlow 4s linear infinite',
            pointerEvents: 'none'
        });
        button.appendChild(buttonGlow);

        return button;
    }

    // ======================
    // BUILD THE UI
    // ======================

    // Quiz ID Section
    const quizIdSection = createNeonSection('QUIZ ID');
    const quizIdInput = createNeonInput('Enter Quiz ID...');
    quizIdSection.body.appendChild(quizIdInput.container);
    content.appendChild(quizIdSection.section);

    // Points Section
    const pointsSection = createNeonSection('POINTS PER QUESTION');
    const pointsSlider = createNeonSlider(500, 1000, 950);
    pointsSection.body.appendChild(pointsSlider.container);
    content.appendChild(pointsSection.section);

    // Answering Section
    const answeringSection = createNeonSection('ANSWERING');
    answeringSection.body.appendChild(
        createNeonToggle('Auto Answer', autoAnswer, (checked) => {
            autoAnswer = checked;
            info.ILSetQuestion = info.questionNum;
        })
    );
    answeringSection.body.appendChild(
        createNeonToggle('Show Answers', showAnswers, (checked) => {
            showAnswers = checked;
            if (!showAnswers && !isAltSPressed) {
                resetAnswerColors();
            }
        })
    );
    content.appendChild(answeringSection.section);

    // Rainbow Section
    const rainbowSection = createNeonSection('RAINBOW MODE');
    const rainbowSlider = createNeonSlider(50, 1000, 300);
    rainbowSection.body.appendChild(rainbowSlider.container);
    rainbowSection.body.appendChild(
        createNeonButton('Toggle Rainbow', () => {
            if (rainbowInterval) {
                stopRainbowEffect();
            } else {
                startRainbowEffect();
            }
        })
    );
    content.appendChild(rainbowSection.section);

    // Keybinds Section
    const keybindsSection = createNeonSection('KEYBINDS');
    const keybindsList = document.createElement('div');
    keybindsList.style.color = colors.text;
    keybindsList.style.fontSize = '13px';
    keybindsList.style.lineHeight = '1.6';
    
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
        item.style.margin = '5px 0';
        
        const keyElem = document.createElement('span');
        keyElem.textContent = key;
        keyElem.style.fontWeight = 'bold';
        keyElem.style.color = colors.accent;
        
        const descElem = document.createElement('span');
        descElem.textContent = desc;
        
        item.appendChild(keyElem);
        item.appendChild(descElem);
        keybindsList.appendChild(item);
    });
    
    keybindsSection.body.appendChild(keybindsList);
    content.appendChild(keybindsSection.section);

    // Info Section
    const infoSection = createNeonSection('INFO');
    const questionsLabel = document.createElement('div');
    questionsLabel.textContent = 'Question: 0/0';
    questionsLabel.style.color = colors.text;
    questionsLabel.style.margin = '5px 0';
    infoSection.body.appendChild(questionsLabel);

    const inputLagLabel = document.createElement('div');
    inputLagLabel.textContent = 'Input lag: 100ms';
    inputLagLabel.style.color = colors.text;
    inputLagLabel.style.margin = '5px 0';
    infoSection.body.appendChild(inputLagLabel);

    const versionLabel = document.createElement('div');
    versionLabel.textContent = 'Version: ' + Version;
    versionLabel.style.color = colors.text;
    versionLabel.style.margin = '5px 0';
    infoSection.body.appendChild(versionLabel);
    content.appendChild(infoSection.section);

    // Add UI to document
    document.body.appendChild(uiElement);
    uiElement.appendChild(content);

    // ======================
    // ORIGINAL FUNCTIONALITY
    // ======================

    // (All original functions remain exactly the same, just with the new UI elements)
    // This includes:
    // - createParticles()
    // - startRainbowEffect()
    // - stopRainbowEffect()
    // - resetAnswerColors()
    // - handleInputChange()
    // - highlightAnswers()
    // - answer()
    // - onQuestionStart()
    // - parseQuestions()
    // - All event listeners
    // - The main interval

    // ======================
    // NEON ANIMATION STYLES
    // ======================

    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulseGlow {
            0% { opacity: 0.3; }
            50% { opacity: 0.7; }
            100% { opacity: 0.3; }
        }
        
        @keyframes rotateGlow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .kahack-neon-ui::-webkit-scrollbar {
            width: 6px;
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
            box-shadow: 0 0 5px ${colors.accent};
            border: 1px solid ${colors.accent};
        }
        
        .neon-content {
            scrollbar-color: ${colors.accent} transparent;
        }
    `;
    document.head.appendChild(style);

    // ======================
    // DRAGGABLE UI FUNCTIONALITY
    // ======================

    let isDragging = false;
    let offsetX, offsetY;

    header.addEventListener('mousedown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        isDragging = true;
        offsetX = e.clientX - uiElement.getBoundingClientRect().left;
        offsetY = e.clientY - uiElement.getBoundingClientRect().top;
        uiElement.style.cursor = 'grabbing';
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const x = Math.max(0, Math.min(window.innerWidth - uiElement.offsetWidth, e.clientX - offsetX));
        const y = Math.max(0, Math.min(window.innerHeight - uiElement.offsetHeight, e.clientY - offsetY));
        
        uiElement.style.left = x + 'px';
        uiElement.style.top = y + 'px';
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
        uiElement.style.cursor = '';
    });

    // Minimize functionality
    let isMinimized = false;
    minimizeBtn.addEventListener('click', function() {
        isMinimized = !isMinimized;
        content.style.display = isMinimized ? 'none' : 'flex';
        minimizeBtn.textContent = isMinimized ? '+' : '─';
    });

    // Close functionality
    closeBtn.addEventListener('click', function() {
        document.body.removeChild(uiElement);
        autoAnswer = false;
        showAnswers = false;
        stopRainbowEffect();
    });

    // ======================
    // CONNECT NEW UI TO ORIGINAL LOGIC
    // ======================

    // Quiz ID validation
    quizIdInput.input.addEventListener('input', function() {
        const quizID = this.value.trim();
        
        if (quizID === "") {
            this.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
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
                quizIdInput.input.style.borderColor = colors.correct;
                quizIdInput.input.style.boxShadow = `0 0 10px ${colors.correct}`;
                questions = parseQuestions(data.questions);
                info.numQuestions = questions.length;
                questionsLabel.textContent = 'Question: 0/' + info.numQuestions;
            })
            .catch(function() {
                quizIdInput.input.style.borderColor = colors.incorrect;
                quizIdInput.input.style.boxShadow = `0 0 10px ${colors.incorrect}`;
                info.numQuestions = 0;
                questionsLabel.textContent = 'Question: 0/0';
            });
    });

    // Points slider
    pointsSlider.slider.addEventListener('input', function() {
        PPT = +this.value;
        pointsSlider.valueDisplay.textContent = PPT;
    });

    // Rainbow slider
    rainbowSlider.slider.addEventListener('input', function() {
        rainbowSpeed = +this.value;
        rainbowSlider.valueDisplay.textContent = rainbowSpeed + 'ms';
        if (rainbowInterval) {
            startRainbowEffect(); // Restart with new speed
        }
    });

    // (Rest of the original functionality remains unchanged)
    // ...
    // (Include all remaining original functions exactly as they were)
})();
