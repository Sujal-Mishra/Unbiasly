const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const htmlElement = document.documentElement;

themeToggle.addEventListener('click', () => {
    htmlElement.classList.toggle('dark');
    
    // Switch between moon and sun icons
    if (htmlElement.classList.contains('dark')) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
});

// --- Core App Logic ---
const form = document.getElementById('biasForm');
const textInput = document.getElementById('textInput');
const charCount = document.getElementById('charCount');
const submitBtn = document.getElementById('submitBtn');

const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const resultsPanel = document.getElementById('resultsPanel');

const biasBadge = document.getElementById('biasBadge');
const explanationText = document.getElementById('explanationText');
const findingsList = document.getElementById('findingsList');

// Dynamic Character Counter
textInput.addEventListener('input', () => {
    charCount.textContent = `${textInput.value.length} characters`;
});

// Form Submit Event Interception
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (textInput.value.trim().length < 10) {
        alert('Please enter a more substantial piece of text to properly assess bias patterns.');
        return;
    }

    // Show Loading State
    emptyState.classList.add('hidden');
    resultsPanel.classList.add('hidden');
    loadingState.classList.remove('hidden');
    submitBtn.disabled = true;

    // Simulate Backend processing
    setTimeout(() => {
        const userText = textInput.value.toLowerCase();
        let mockData;

        if (userText.includes('always') || userText.includes('never') || userText.includes('better')) {
            mockData = {
                biasDetected: true,
                explanation: "The system flagged this excerpt due to the presence of absolute generalizations and polarizing nouns. The context implicitly establishes an unverified hierarchy, which skews linguistic neutrality values.",
                findings: [
                    "Contains extreme language absolute thresholds ('always/never').",
                    "Exhibits a subtle 'us vs. them' outgroup framing dynamic.",
                    "Lacks structural neutralizing modifiers required for balanced reporting."
                ]
            };
        } else {
            mockData = {
                biasDetected: false,
                explanation: "The text relies on passive, objective observations and presents verifiable claims without highly emotionally charged vocabulary. The language metrics match a neutral sentiment framework.",
                findings: [
                    "Maintains objective linguistic sentiment standards.",
                    "No targeted generalizations or loaded adjectives observed.",
                    "Syntactic balance falls safely within standardized baseline tolerances."
                ]
            };
        }

        renderResults(mockData);

        // Show Results State
        loadingState.classList.add('hidden');
        resultsPanel.classList.remove('hidden');
        submitBtn.disabled = false;
    }, 1500);
});

function renderResults(data) {
    if (data.biasDetected) {
        biasBadge.innerHTML = `
            <span class="inline-flex items-center space-x-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-rose-100 dark:border-rose-800">
                <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>Bias Flagged</span>
            </span>
        `;
    } else {
        biasBadge.innerHTML = `
            <span class="inline-flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Neutral / Clear</span>
            </span>
        `;
    }

    explanationText.textContent = data.explanation;
    findingsList.innerHTML = ''; 
    
    data.findings.forEach(finding => {
        const li = document.createElement('li');
        li.className = "flex items-start space-x-2";
        li.innerHTML = `
            <i class="fa-solid ${data.biasDetected ? 'fa-triangle-exclamation text-amber-500' : 'fa-circle-check text-emerald-500'} mt-1 text-xs shrink-0"></i>
            <span>${finding}</span>
        `;
        findingsList.appendChild(li);
    });
}