// == KaHack! Console Version == //
(function() {
    // Check if already injected
    if (window.KaHackInjected) return;
    window.KaHackInjected = true;

    // Wait for DOM to load
    document.addEventListener('DOMContentLoaded', function() {
        // --- Core Variables --- //
        const Kahack = {
            version: '1.0.25-console',
            questions: [],
            info: {
                numQuestions: 0,
                questionNum: -1,
                lastAnsweredQuestion: -1,
                defaultIL: true,
                ILSetQuestion: -1
            },
            PPT: 950,
            Answered_PPT: 950,
            autoAnswer: false,
            showAnswers: false,
            inputLag: 100,
            forceCorrectMode: false,
            isHidden: false
        };

        // --- Utility Functions --- //
        function findByAttribute(attribute, value, elementType = "*") {
            const elements = document.getElementsByTagName(elementType);
            return Array.from(elements).find(el => el.getAttribute(attribute) === value);
        }

        // --- UI Creation --- //
        function createUI() {
            // Floating UI Container
            const uiElement = document.createElement('div');
            uiElement.id = 'kahack-ui';
            uiElement.style.cssText = `
                position: fixed; 
                top: 5%; 
                left: 5%; 
                width: 330px; 
                background: #381272; 
                border-radius: 10px; 
                box-shadow: 0 0 10px rgba(0,0,0,0.5); 
                z-index: 9999;
            `;

            // [Add all UI components here following original structure...]
            // ... (Include all UI elements from original script with style adjustments)

            document.body.appendChild(uiElement);
            return uiElement;
        }

        // --- Core Functionality --- //
        function handleAnswerClick(e) {
            if (!Kahack.forceCorrectMode || e.button !== 0) return;
            
            const clickedBtn = e.target.closest('button[data-functional-selector^="answer-"]');
            if (!clickedBtn || Kahack.info.questionNum === -1) return;

            const question = Kahack.questions[Kahack.info.questionNum];
            if (!question?.answers?.length) return;

            const correctBtn = findByAttribute(
                'data-functional-selector', 
                `answer-${question.answers[0]}`, 
                'button'
            );

            if (correctBtn) {
                e.stopImmediatePropagation();
                e.preventDefault();
                correctBtn.click();
            }
        }

        // --- Main Execution --- //
        let ui = createUI();
        
        // Event Listeners
        document.addEventListener('mousedown', handleAnswerClick, true);
        
        // Auto-update question tracking
        setInterval(() => {
            const indexElement = findByAttribute('data-functional-selector', 'question-index-counter');
            if (indexElement) {
                Kahack.info.questionNum = parseInt(indexElement.textContent) - 1;
            }
        }, 100);

        console.log('[KaHack!] Successfully injected! Use Alt+H to toggle UI');
    });

    // Style override to ensure visibility
    const style = document.createElement('style');
    style.textContent = `
        #kahack-ui * {
            font-family: Arial, sans-serif !important;
            box-sizing: border-box;
        }
        .kahack-slider {
            -webkit-appearance: none;
            width: 70%;
            height: 5px;
            background: #fff;
            border-radius: 5px;
        }
    `;
    document.head.appendChild(style);
})();
