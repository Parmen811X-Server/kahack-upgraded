// ==UserScript==
// @name         KaHack! Ultra Smooth
// @version      3.0.0
// @namespace    https://github.com/jokeri2222
// @description  Ultimate Kahoot hack with flawless performance
// @match        https://kahoot.it/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kahoot.it
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 500);
    }

    function init() {
        // Configuration
        const Version = '3.0.0';
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
            totalAnswered: 0
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
        let isSoundEnabled = true;
        let isDarkMode = true;

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

        // Sound Effects (Web Audio API)
        const playSound = (type) => {
            if (!isSoundEnabled) return;
            
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                switch(type) {
                    case 'success': osc.frequency.value = 880; break;
                    case 'error': osc.frequency.value = 220; break;
                    case 'toggle': osc.frequency.value = 523.25; break;
                    case 'click': osc.frequency.value = 349.23; break;
                    case 'rainbow': osc.frequency.value = 659.25; break;
                }
                
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
            } catch (e) {
                console.log("Audio error:", e);
            }
        };

        // DOM Helper Functions
        function FindByAttributeValue(attribute, value, element_type) {
            element_type = element_type || "*";
            const All = document.getElementsByTagName(element_type);
            for (let i = 0; i < All.length; i++) {
                if (All[i].getAttribute(attribute) === value) return All[i];
            }
            return null;
        }

        function createElement(tag, props = {}, children = []) {
            const el = document.createElement(tag);
            Object.assign(el, props);
            children.forEach(child => el.appendChild(child));
            return el;
        }

        // Lightweight Particle Effect
        function createParticles(element, count = 5) {
            if (!element || !element.getBoundingClientRect) return;
            
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
                        if (particle && particle.parentNode) {
                            particle.parentNode.removeChild(particle);
                        }
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

        // Rainbow Mode
        function startRainbowEffect() {
            if (rainbowInterval) clearInterval(rainbowInterval);
            
            function applyRainbowColors() {
                const buttons = document.querySelectorAll(
                    'button[data-functional-selector^="answer-"], button[data-functional-selector^="multi-select-button-"]'
                );
                
                buttons.forEach(button => {
                    if (button) {
                        const randomColor = currentColors.rainbow[Math.floor(Math.random() * currentColors.rainbow.length)];
                        button.style.cssText = `
                            background-color: ${randomColor} !important;
                            transition: background-color ${rainbowSpeed/1000}s ease !important;
                        `;
                    }
                });
            }
            
            applyRainbowColors();
            rainbowInterval = setInterval(applyRainbowColors, rainbowSpeed);
            playSound('rainbow');
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
                if (button) {
                    button.style.removeProperty('background-color');
                    button.style.removeProperty('transition');
                }
            });
        }

        // Create UI Elements
        function createUI() {
            // Main UI Container
            const uiElement = createElement('div', {
                className: 'kahack-ui',
                style: {
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
                    transition: 'opacity 0.3s ease, transform 0.2s ease',
                    willChange: 'transform'
                }
            });

            // Header with Draggable Area
            const handle = createElement('div', {
                className: 'kahack-header',
                style: {
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
                }
            }, [
                createElement('div', {
                    textContent: 'KaHack! Ultra',
                    style: {
                        fontWeight: 'bold',
                        fontSize: '16px'
                    }
                }),
                createElement('div', {
                    style: {
                        display: 'flex',
                        gap: '5px'
                    }
                }, [
                    createMinimizeButton(),
                    createCloseButton()
                ])
            ]);

            // Content Container
            const content = createElement('div', {
                className: 'kahack-content',
                style: {
                    padding: '15px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    backgroundColor: currentColors.primary
                }
            }, [
                createQuizIdSection(),
                createPointsSection(),
                createAnsweringSection(),
                createRainbowSection(),
                createKeybindsSection(),
                createStatsSection(),
                createSettingsSection(),
                createVersionSection()
            ]);

            uiElement.appendChild(handle);
            uiElement.appendChild(content);

            // Add to DOM with safety check
            if (document.body) {
                document.body.appendChild(uiElement);
            } else {
                window.addEventListener('DOMContentLoaded', () => {
                    document.body.appendChild(uiElement);
                });
            }

            // Setup Dragging
            setupDragging(uiElement, handle);

            return { uiElement, content };
        }

        function createMinimizeButton() {
            const btn = createElement('div', {
                textContent: '─',
                style: {
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
                }
            });

            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.1)';
                createParticles(btn, 3);
                playSound('click');
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
            });

            return btn;
        }

        function createCloseButton() {
            const btn = createElement('div', {
                textContent: '✕',
                style: {
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
                }
            });

            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.1)';
                createParticles(btn, 3);
                playSound('click');
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
            });

            return btn;
        }

        function createSection(titleText) {
            const section = createElement('div', {
                style: {
                    backgroundColor: currentColors.secondary,
                    borderRadius: '8px',
                    padding: '12px',
                    border: `1px solid ${currentColors.accent}`,
                    transition: 'transform 0.2s ease'
                }
            }, [
                createElement('h3', {
                    textContent: titleText,
                    style: {
                        margin: '0 0 10px 0',
                        color: currentColors.text,
                        fontSize: '16px'
                    }
                })
            ]);

            section.addEventListener('mouseenter', () => {
                section.style.transform = 'translateY(-2px)';
                createParticles(section, 2);
            });
            section.addEventListener('mouseleave', () => {
                section.style.transform = 'translateY(0)';
            });

            return section;
        }

        function createQuizIdSection() {
            const section = createSection('QUIZ ID');
            const inputBox = createElement('input', {
                placeholder: 'Enter Quiz ID...',
                style: {
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #555',
                    backgroundColor: '#fff',
                    color: '#000',
                    fontSize: '14px',
                    transition: 'box-shadow 0.3s ease'
                }
            });

            inputBox.addEventListener('input', handleInputChange);
            section.appendChild(inputBox);

            return section;
        }

        function createPointsSection() {
            const section = createSection('POINTS PER QUESTION');
            const container = createElement('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }
            }, [
                createElement('input', {
                    type: 'range',
                    min: '500',
                    max: '1000',
                    value: '950',
                    style: { flex: '1' }
                }),
                createElement('span', {
                    textContent: '950',
                    style: {
                        color: currentColors.text,
                        minWidth: '40px',
                        textAlign: 'center'
                    }
                })
            ]);

            const slider = container.querySelector('input');
            const label = container.querySelector('span');

            slider.addEventListener('input', function() {
                PPT = +this.value;
                label.textContent = PPT;
                playSound('click');
            });

            section.appendChild(container);
            return section;
        }

        function createToggle(labelText, checked, onChange) {
            const container = createElement('div', {
                style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    margin: '8px 0'
                }
            }, [
                createElement('span', {
                    textContent: labelText,
                    style: {
                        color: currentColors.text,
                        fontSize: '14px'
                    }
                }),
                createElement('label', {
                    style: {
                        position: 'relative',
                        display: 'inline-block',
                        width: '50px',
                        height: '24px'
                    }
                }, [
                    createElement('input', {
                        type: 'checkbox',
                        checked: checked,
                        style: {
                            opacity: '0',
                            width: '0',
                            height: '0'
                        }
                    }),
                    createElement('span', {
                        style: {
                            position: 'absolute',
                            cursor: 'pointer',
                            top: '0',
                            left: '0',
                            right: '0',
                            bottom: '0',
                            backgroundColor: checked ? currentColors.correct : currentColors.incorrect,
                            transition: '.4s',
                            borderRadius: '24px'
                        }
                    }, [
                        createElement('span', {
                            style: {
                                position: 'absolute',
                                content: '""',
                                height: '16px',
                                width: '16px',
                                left: checked ? '26px' : '4px',
                                bottom: '4px',
                                backgroundColor: '#fff',
                                transition: '.4s',
                                borderRadius: '50%'
                            }
                        })
                    ])
                ])
            ]);

            const input = container.querySelector('input');
            const slider = container.querySelector('span > span');
            const sliderBefore = slider.querySelector('span');

            input.addEventListener('change', function() {
                onChange(this.checked);
                slider.style.backgroundColor = this.checked ? currentColors.correct : currentColors.incorrect;
                sliderBefore.style.left = this.checked ? '26px' : '4px';
                createParticles(slider, 3);
                playSound('toggle');
            });

            return container;
        }

        function createAnsweringSection() {
            const section = createSection('ANSWERING');
            
            section.appendChild(createToggle('Auto Answer', autoAnswer, function(checked) {
                autoAnswer = checked;
                info.ILSetQuestion = info.questionNum;
            }));

            section.appendChild(createToggle('Show Answers', showAnswers, function(checked) {
                showAnswers = checked;
                if (!showAnswers && !isAltSPressed) {
                    resetAnswerColors();
                }
            }));

            return section;
        }

        function createRainbowSection() {
            const section = createSection('RAINBOW MODE');
            const container = createElement('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }
            }, [
                createElement('input', {
                    type: 'range',
                    min: '50',
                    max: '1000',
                    value: '300',
                    style: { flex: '1' }
                }),
                createElement('span', {
                    textContent: '300ms',
                    style: {
                        color: currentColors.text,
                        minWidth: '50px',
                        textAlign: 'center'
                    }
                })
            ]);

            const slider = container.querySelector('input');
            const label = container.querySelector('span');

            const rainbowButton = createElement('button', {
                textContent: 'Toggle Rainbow',
                style: {
                    width: '100%',
                    padding: '8px',
                    marginTop: '10px',
                    backgroundColor: currentColors.accent,
                    color: currentColors.text,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease'
                }
            });
            
            rainbowButton.addEventListener('mouseenter', () => {
                rainbowButton.style.transform = 'scale(1.02)';
                playSound('click');
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
            
            slider.addEventListener('input', function() {
                rainbowSpeed = +this.value;
                label.textContent = rainbowSpeed + 'ms';
                if (rainbowInterval) {
                    startRainbowEffect();
                }
                playSound('click');
            });
            
            section.appendChild(container);
            section.appendChild(rainbowButton);
            return section;
        }

        function createKeybindsSection() {
            const section = createSection('KEYBINDS');
            const keybindsList = createElement('div', {
                style: {
                    color: currentColors.text,
                    fontSize: '13px',
                    lineHeight: '1.5'
                }
            });
            
            const keybinds = [
                ['ALT + H', 'Toggle UI visibility'],
                ['ALT + W', 'Answer correctly'],
                ['ALT + S', 'Show answers (while held)'],
                ['ALT + R', 'Rainbow mode (while held)'],
                ['Shift', 'Quick hide/show'],
                ['ALT + D', 'Toggle dark mode']
            ];
            
            keybinds.forEach(([key, desc]) => {
                const item = createElement('div', {
                    style: {
                        display: 'flex',
                        justifyContent: 'space-between'
                    }
                }, [
                    createElement('span', {
                        textContent: key,
                        style: {
                            fontWeight: 'bold'
                        }
                    }),
                    createElement('span', {
                        textContent: desc
                    })
                ]);
                
                keybindsList.appendChild(item);
            });
            
            section.appendChild(keybindsList);
            return section;
        }

        function createStatsSection() {
            const section = createSection('STATISTICS');
            
            section.appendChild(createElement('div', {
                textContent: 'Question: 0/0',
                style: {
                    color: currentColors.text
                }
            }));

            section.appendChild(createElement('div', {
                textContent: 'Input lag: 100ms',
                style: {
                    color: currentColors.text
                }
            }));

            section.appendChild(createElement('div', {
                textContent: 'Streak: 0 (Highest: 0)',
                style: {
                    color: currentColors.text
                }
            }));

            section.appendChild(createElement('div', {
                textContent: 'Correct: 0/0 (0%)',
                style: {
                    color: currentColors.text
                }
            }));

            return section;
        }

        function createSettingsSection() {
            const section = createSection('SETTINGS');
            
            section.appendChild(createToggle('Enable Sounds', isSoundEnabled, function(checked) {
                isSoundEnabled = checked;
                if (checked) playSound('success');
            }));

            section.appendChild(createToggle('Dark Mode', isDarkMode, function(checked) {
                isDarkMode = checked;
                currentColors = checked ? colors.dark : colors.light;
                updateUITheme();
                playSound('toggle');
            }));

            return section;
        }

        function createVersionSection() {
            const section = createSection('INFO');
            section.appendChild(createElement('div', {
                textContent: 'Version: ' + Version,
                style: {
                    color: currentColors.text
                }
            }));
            return section;
        }

        function updateUITheme() {
            const ui = document.querySelector('.kahack-ui');
            if (!ui) return;

            ui.style.backgroundColor = currentColors.primary;
            ui.style.borderColor = currentColors.accent;

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

            // Update buttons and controls
            const buttons = document.querySelectorAll('button');
            buttons.forEach(btn => {
                btn.style.backgroundColor = currentColors.accent;
                btn.style.color = currentColors.text;
            });

            const toggles = document.querySelectorAll('label > span > span');
            toggles.forEach(toggle => {
                const input = toggle.parentElement.parentElement.querySelector('input');
                toggle.style.backgroundColor = input.checked ? currentColors.correct : currentColors.incorrect;
            });
        }

        function setupDragging(uiElement, handle) {
            let isDragging = false;
            let offsetX, offsetY;
            let dragFrame;

            handle.addEventListener('mousedown', function(e) {
                isDragging = true;
                offsetX = e.clientX - uiElement.getBoundingClientRect().left;
                offsetY = e.clientY - uiElement.getBoundingClientRect().top;
                document.body.style.userSelect = 'none';
                cancelAnimationFrame(dragFrame);
                playSound('click');
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
                    playSound('click');
                }
            });
        }

        // Quiz ID Validation
        function handleInputChange() {
            const inputBox = document.querySelector('.kahack-content input[type="text"]');
            const questionsLabel = document.querySelector('.kahack-content div:first-child');
            
            if (!inputBox || !questionsLabel) return;
            
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
                    inputBox.style.backgroundColor = currentColors.correct;
                    inputBox.style.boxShadow = currentColors.hoverGlow;
                    questions = parseQuestions(data.questions);
                    info.numQuestions = questions.length;
                    questionsLabel.textContent = 'Question: 0/' + info.numQuestions;
                    createParticles(inputBox, 8);
                    playSound('success');
                })
                .catch(function() {
                    inputBox.style.backgroundColor = currentColors.incorrect;
                    info.numQuestions = 0;
                    questionsLabel.textContent = 'Question: 0/0';
                    playSound('error');
                });
        }

        // Answer Highlighting
        function highlightAnswers(question) {
            if (!question) return;
            
            const answerButtons = document.querySelectorAll(
                'button[data-functional-selector^="answer-"], button[data-functional-selector^="multi-select-button-"]'
            );
            
            answerButtons.forEach(function(button) {
                if (button) {
                    button.style.removeProperty('background-color');
                }
            });
            
            if (question.answers) {
                question.answers.forEach(function(answer) {
                    const btn = FindByAttributeValue("data-functional-selector", "answer-" + answer, "button") || 
                              FindByAttributeValue("data-functional-selector", "multi-select-button-" + answer, "button");
                    if (btn) {
                        btn.style.setProperty('background-color', currentColors.correct, 'important');
                    }
                });
            }
            
            if (question.incorrectAnswers) {
                question.incorrectAnswers.forEach(function(answer) {
                    const btn = FindByAttributeValue("data-functional-selector", "answer-" + answer, "button") || 
                              FindByAttributeValue("data-functional-selector", "multi-select-button-" + answer, "button");
                    if (btn) {
                        btn.style.setProperty('background-color', currentColors.incorrect, 'important');
                    }
                });
            }
        }

        // Question Answering with Stats
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
                
                info.streak++;
                info.totalCorrect++;
                info.totalAnswered++;
                if (info.streak > info.highestStreak) info.highestStreak = info.streak;
                updateStats();
            }, time - delay);
        }

        function updateStats() {
            const statsSection = document.querySelector('.kahack-content div:nth-child(6)');
            if (!statsSection) return;
            
            const labels = statsSection.querySelectorAll('div');
            if (labels.length >= 4) {
                labels[0].textContent = `Question: ${info.questionNum + 1}/${info.numQuestions}`;
                labels[1].textContent = `Input lag: ${inputLag}ms`;
                labels[2].textContent = `Streak: ${info.streak} (Highest: ${info.highestStreak})`;
                
                const percentage = info.totalAnswered > 0 
                    ? Math.round((info.totalCorrect / info.totalAnswered) * 100) 
                    : 0;
                labels[3].textContent = `Correct: ${info.totalCorrect}/${info.totalAnswered} (${percentage}%)`;
            }
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

        // Question Parser
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

        // Create the UI
        const { uiElement, content } = createUI();

        // Set up event listeners
        function setupEventListeners() {
            // Close button
            const closeButton = document.querySelector('.kahack-header div:last-child div:last-child');
            if (closeButton) {
                closeButton.addEventListener('click', function() {
                    if (uiElement && uiElement.parentNode) {
                        uiElement.parentNode.removeChild(uiElement);
                    }
                    autoAnswer = false;
                    showAnswers = false;
                    stopRainbowEffect();
                    playSound('toggle');
                });
            }

            // Minimize button
            const minimizeButton = document.querySelector('.kahack-header div:last-child div:first-child');
            let isMinimized = false;
            if (minimizeButton) {
                minimizeButton.addEventListener('click', function() {
                    isMinimized = !isMinimized;
                    content.style.display = isMinimized ? 'none' : 'flex';
                    playSound('click');
                });
            }

            // Keybind Handlers
            document.addEventListener('keydown', function(e) {
                // ALT+H - Toggle full stealth mode
                if (e.key.toLowerCase() === 'h' && e.altKey && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    isAltHPressed = !isAltHPressed;
                    uiElement.style.opacity = isAltHPressed ? '0' : '1';
                    uiElement.style.pointerEvents = isAltHPressed ? 'none' : 'auto';
                    createParticles(uiElement, 10);
                    playSound('toggle');
                }
                
                // SHIFT - Quick hide/show
                if (e.key === 'Shift' && !e.altKey && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    uiElement.style.opacity = uiElement.style.opacity === '0' ? '1' : '0';
                    playSound('click');
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
                    
                    info.streak++;
                    info.totalCorrect++;
                    info.totalAnswered++;
                    if (info.streak > info.highestStreak) info.highestStreak = info.streak;
                    updateStats();
                    playSound('success');
                }
                
                // ALT+S - Show answers while held
                if (e.key.toLowerCase() === 's' && e.altKey && info.questionNum !== -1) {
                    e.preventDefault();
                    isAltSPressed = true;
                    highlightAnswers(questions[info.questionNum]);
                    playSound('toggle');
                }
                
                // ALT+R - Rainbow mode while held
                if (e.key.toLowerCase() === 'r' && e.altKey && !isAltRPressed) {
                    e.preventDefault();
                    isAltRPressed = true;
                    startRainbowEffect();
                }
                
                // ALT+D - Toggle dark mode
                if (e.key.toLowerCase() === 'd' && e.altKey) {
                    e.preventDefault();
                    isDarkMode = !isDarkMode;
                    currentColors = isDarkMode ? colors.dark : colors.light;
                    updateUITheme();
                    playSound('toggle');
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

            // Main Interval
            setInterval(function() {
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
                
                // Reset streak if wrong answer
                const wrongAnswerElement = document.querySelector('[data-functional-selector*="feedback-text"]');
                if (wrongAnswerElement && wrongAnswerElement.textContent.includes("Wrong")) {
                    info.streak = 0;
                    info.totalAnswered++;
                    updateStats();
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
                            updateStats();
                        }
                    }
                }
            }, 50);
        }

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
            button:hover {
                transform: scale(1.02);
            }
        `;
        document.head.appendChild(style);

        // Initialize everything
        setupEventListeners();
    }
})();
