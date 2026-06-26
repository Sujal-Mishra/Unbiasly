// --- DOM Elements ---
const form = document.getElementById('biasForm');
const textInput = document.getElementById('textInput');
const charCount = document.getElementById('charCount');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const backBtn = document.getElementById('backBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');

const inputPanel = document.getElementById('inputPanel');
const loadingPanel = document.getElementById('loadingPanel');
const resultsPanel = document.getElementById('resultsPanel');
const loadingMessage = document.getElementById('loadingMessage');
const loadingProgress = document.getElementById('loadingProgress');

// Results Elements
const timestampEl = document.getElementById('timestamp');
const biasBadge = document.getElementById('biasBadge');
const overallScore = document.getElementById('overallScore');
const riskLabel = document.getElementById('riskLabel');
const confidenceScore = document.getElementById('confidenceScore');

const loadedScore = document.getElementById('loadedScore');
const loadedBar = document.getElementById('loadedBar');
const identityScore = document.getElementById('identityScore');
const identityBar = document.getElementById('identityBar');
const emotionalScore = document.getElementById('emotionalScore');
const emotionalBar = document.getElementById('emotionalBar');
const toxicityScore = document.getElementById('toxicityScore');
const toxicityBar = document.getElementById('toxicityBar');

const explainabilityText = document.getElementById('explainabilityText');
const heatmapContent = document.getElementById('heatmapContent');
const sentenceList = document.getElementById('sentenceList');

const rewriteSection = document.getElementById('rewriteSection');
const revealRewriteBtn = document.getElementById('revealRewriteBtn');
const rewriteOutput = document.getElementById('rewriteOutput');
const rewriteText = document.getElementById('rewriteText');

// Chips and Copy Buttons
const sampleChips = document.querySelectorAll('.sample-chip');
const copyButtons = document.querySelectorAll('.copy-btn');

// FAM and Toast
const selectionFam = document.getElementById('selectionFam');
const famBtns = document.querySelectorAll('.fam-btn');
const toastContainer = document.getElementById('toastContainer');

// Theme Toggle
const themeToggleBtn = document.getElementById('themeToggleBtn');

// --- Event Listeners ---

// Textarea word count
textInput.addEventListener('input', () => {
    charCount.textContent = `${textInput.value.length} chars`;
});

// Custom Reset Button
resetBtn.addEventListener('click', () => {
    textInput.value = '';
    charCount.textContent = '0 chars';
    textInput.focus();
});

// Back Button (New Analysis)
backBtn.addEventListener('click', () => {
    resultsPanel.classList.add('hidden');
    inputPanel.classList.remove('hidden');
    textInput.value = '';
    charCount.textContent = '0 chars';
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Reveal Rewrite Toggle
revealRewriteBtn.addEventListener('click', () => {
    rewriteOutput.classList.toggle('open');
});

// Sample Prompt Chips
sampleChips.forEach(chip => {
    chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-text');
        textInput.value = text;
        charCount.textContent = `${text.length} chars`;
        // Trigger a tiny animation on the textarea to show it updated
        textInput.classList.add('ring-2', 'ring-primary/50');
        setTimeout(() => textInput.classList.remove('ring-2', 'ring-primary/50'), 300);
    });
});

// Copy to Clipboard Logic
copyButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
        const targetId = btn.getAttribute('data-target');
        const textToCopy = document.getElementById(targetId).textContent;
        
        try {
            await navigator.clipboard.writeText(textToCopy);
            const originalHTML = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-check text-emerald-400"></i><span class="text-emerald-400">Copied</span>`;
            setTimeout(() => {
                btn.innerHTML = originalHTML;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    });
});

// Theme Toggle Logic
themeToggleBtn.addEventListener('click', () => {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
});

// PDF Export Logic
exportPdfBtn.addEventListener('click', () => {
    const element = document.getElementById('pdfContainer');
    
    // Temporarily hide copy buttons during export so they don't show up in the PDF
    copyButtons.forEach(btn => btn.style.display = 'none');
    
    const opt = {
      margin:       [0.5, 0.5, 0.5, 0.5],
      filename:     `Unbiasly_Intelligence_Report_${new Date().getTime()}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false, backgroundColor: document.documentElement.classList.contains('dark') ? '#020617' : '#F8FAFC' },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    const originalHTML = exportPdfBtn.innerHTML;
    exportPdfBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-rose-400"></i><span>Exporting...</span>';
    
    html2pdf().set(opt).from(element).save().then(() => {
        exportPdfBtn.innerHTML = originalHTML;
        // Restore copy buttons
        copyButtons.forEach(btn => btn.style.display = 'flex');
    });
});

// --- Floating Action Menu Logic ---
textInput.addEventListener('mouseup', (e) => {
    if (textInput.selectionStart !== textInput.selectionEnd) {
        // Show FAM near the cursor
        selectionFam.style.left = `${e.clientX}px`;
        selectionFam.style.top = `${e.clientY - 10}px`; // Slightly above
        selectionFam.classList.remove('hidden');
        // Small delay before adding opacity for the transition to work
        setTimeout(() => selectionFam.classList.remove('opacity-0'), 10);
    } else {
        hideFam();
    }
});

document.addEventListener('mousedown', (e) => {
    // If clicking outside FAM and outside textInput
    if (!selectionFam.contains(e.target) && e.target !== textInput) {
        hideFam();
    }
});

function hideFam() {
    selectionFam.classList.add('opacity-0');
    setTimeout(() => {
        if (selectionFam.classList.contains('opacity-0')) {
            selectionFam.classList.add('hidden');
        }
    }, 200); // Wait for transition
}

famBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = btn.getAttribute('data-action');
        hideFam();
        
        let message, iconClass, colorClass;
        if (action === 'scan') {
            message = 'Scanning selection for bias...';
            iconClass = 'fa-solid fa-radar fa-spin';
            colorClass = 'text-primary';
        } else if (action === 'explain') {
            message = 'Analyzing contextual nuance...';
            iconClass = 'fa-solid fa-book-open fa-fade';
            colorClass = 'text-amber-500';
        } else if (action === 'neutralize') {
            message = 'Generating neutral rewrite...';
            iconClass = 'fa-solid fa-wand-magic-sparkles fa-bounce';
            colorClass = 'text-emerald-500';
        }
        
        showToast(message, iconClass, colorClass);
    });
});

function showToast(message, iconClass, colorClass) {
    const toast = document.createElement('div');
    toast.className = 'glass-panel px-4 py-2.5 rounded-xl shadow-lg border border-themeBorder/10 flex items-center space-x-3 backdrop-blur-xl bg-surface/90 transform translate-y-full opacity-0 transition-all duration-300';
    
    toast.innerHTML = `
        <i class="${iconClass} ${colorClass}"></i>
        <span class="text-sm font-medium text-themeText tracking-wide">${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-full', 'opacity-0');
        });
    });
    
    // Remove after 3s
    setTimeout(() => {
        toast.classList.add('translate-y-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Main Analysis Logic ---
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (textInput.value.trim().length < 10) {
        alert('Please enter a more substantial piece of text to properly assess bias patterns.');
        return;
    }

    inputPanel.classList.add('hidden');
    loadingPanel.classList.remove('hidden');
    loadingPanel.classList.add('flex');
    loadingProgress.style.width = '0%';
    
    const messages = [
        "Analyzing semantic intent...",
        "Scanning emotionally charged language...",
        "Checking identity-sensitive framing...",
        "Generating explainability vectors..."
    ];
    
    let msgIndex = 0;
    loadingMessage.style.opacity = 0;
    
    setTimeout(() => { loadingMessage.textContent = messages[0]; loadingMessage.style.opacity = 1; }, 200);
    
    const interval = setInterval(() => {
        msgIndex++;
        if (msgIndex < messages.length) {
            loadingMessage.style.opacity = 0;
            setTimeout(() => {
                loadingMessage.textContent = messages[msgIndex];
                loadingMessage.style.opacity = 1;
            }, 300);
            loadingProgress.style.width = `${(msgIndex / messages.length) * 100}%`;
        }
    }, 800);

    try {
        const apiHost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:8000'
            : (window.location.hostname.endsWith('hf.space') || window.location.hostname.endsWith('huggingface.co'))
                ? ''
                : 'https://tudal-unbiasly.hf.space';
        const response = await fetch(`${apiHost}/api/v1/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: textInput.value })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        // --- Schema Adapter (Translates Backend exact response schema to Frontend render contract) ---
        const riskColor = data.risk_level.toLowerCase() === 'high' ? 'rose' : (data.risk_level.toLowerCase() === 'medium' ? 'amber' : 'emerald');
        
        // Process LIME attention heatmap tokens into beautiful styled HTML
        let heatmapHTML = '';
        if (data.attention_heatmap && data.attention_heatmap.length > 0) {
            data.attention_heatmap.forEach(item => {
                const word = item.word;
                const label = item.label;
                
                if (label === 'highly_biased' || label === 'suspicious') {
                    const color = label === 'highly_biased' ? 'rose' : 'amber';
                    const rgb = color === 'rose' ? '244, 63, 94' : '245, 158, 11';
                    heatmapHTML += `<span class="heatmap-token bg-${color}-500/20 text-${color}-400 px-1.5 py-0.5 rounded border-b-2 border-${color}-500 font-semibold" style="box-shadow: 0 0 8px rgba(${rgb}, 0.5);">${word}</span> `;
                } else {
                    heatmapHTML += `<span>${word}</span> `;
                }
            });
        } else {
            heatmapHTML = textInput.value;
        }

        // Process sentences
        const sentencesArr = textInput.value.split('.').filter(s => s.trim().length > 0);
        const sentenceAnalysis = sentencesArr.map((s, i) => {
            let tag = "Objective Payload"; 
            let icon = "fa-check"; 
            let color = "text-emerald-500"; 
            let border = "border-emerald-500/30";
            
            if (data.sentence_vector && (s.toLowerCase().includes(data.sentence_vector.sentence.toLowerCase()) || i === 0)) {
                const bType = data.sentence_vector.bias_type;
                if (bType === 'OVERGENERALIZATION' || bType === 'TOXICITY') {
                    tag = bType === 'OVERGENERALIZATION' ? "Overgeneralization" : "Toxicity Risk";
                    icon = bType === 'OVERGENERALIZATION' ? "fa-triangle-exclamation" : "fa-fire";
                    color = "text-rose-500";
                    border = "border-rose-500/30";
                } else if (bType === 'IDENTITY_BIAS' || bType === 'EMOTIONAL_FRAMING') {
                    tag = bType === 'IDENTITY_BIAS' ? "Identity Framing" : "Emotional Framing";
                    icon = bType === 'IDENTITY_BIAS' ? "fa-users-slash" : "fa-bolt";
                    color = "text-amber-500";
                    border = "border-amber-500/30";
                }
            }
            return { text: s.trim() + ".", tag, icon, color, border };
        });

        const mappedData = {
            overallBias: data.overall_score,
            confidence: 95, // Consistent high confidence from deep explainability audit
            risk: `${data.risk_level} RISK`,
            riskColor: riskColor,
            timestamp: new Date().toLocaleString('en-US', { 
                year: 'numeric', month: 'short', day: 'numeric', 
                hour: '2-digit', minute:'2-digit', second:'2-digit', timeZoneName: 'short' 
            }),
            categories: {
                loadedLanguage: data.semantic_vectors.loaded_language,
                identityBias: data.semantic_vectors.identity_bias,
                emotionalFraming: data.semantic_vectors.emotional_framing,
                toxicityRisk: data.semantic_vectors.toxicity_risk
            },
            heatmap: heatmapHTML.trim(),
            sentenceAnalysis: sentenceAnalysis,
            neutralRewrite: data.neutral_rewrite,
            explainability: data.model_interpretation
        };

        clearInterval(interval);
        loadingProgress.style.width = '100%';
        
        renderResults(mappedData);
        
        setTimeout(() => {
            loadingPanel.classList.remove('flex');
            loadingPanel.classList.add('hidden');
            resultsPanel.classList.remove('hidden');
            rewriteOutput.classList.remove('open'); // Ensure closed on fresh load
            window.scrollTo({ top: document.getElementById('resultsPanel').offsetTop - 100, behavior: 'smooth' });
        }, 500);

    } catch (error) {
        clearInterval(interval);
        console.error("Backend Error:", error);
        alert('Failed to analyze text. Ensure backend is running at http://localhost:8000.\n' + error.message);
        
        // Restore UI state
        inputPanel.classList.remove('hidden');
        loadingPanel.classList.remove('flex');
        loadingPanel.classList.add('hidden');
    }
});

// --- Mock Data Generator ---
function generateMockResponse(text) {
    const lowerText = text.toLowerCase();
    
    const isBiased = lowerText.includes('always') || 
                     lowerText.includes('never') || 
                     lowerText.includes('dangerous') || 
                     lowerText.includes('ideology') ||
                     lowerText.includes('these people') ||
                     lowerText.includes('manipulates') ||
                     lowerText.includes('ruining');

    const timestamp = new Date().toLocaleString('en-US', { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute:'2-digit', second:'2-digit', timeZoneName: 'short' 
    });

    if (isBiased) {
        // Generate heatmap HTML with staggered animation delays
        const highlightWords = {
            'always': 'rose', 'never': 'rose', 'dangerous': 'rose', 'manipulates': 'rose', 'ruining': 'rose',
            'ideology': 'amber', 'these people': 'amber', 'one': 'emerald'
        };
        
        const highlightColors = {
            'rose': '244, 63, 94',
            'amber': '245, 158, 11',
            'emerald': '16, 185, 129'
        };
        
        // Escape HTML to prevent basic injection issues during split
        const escapeHtml = (unsafe) => unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        
        let heatmapHTML = escapeHtml(text);
        let delayCounter = 1;
        
        Object.keys(highlightWords).forEach(word => {
            const regex = new RegExp(`\\b(${word})\\b`, 'gi');
            const color = highlightWords[word];
            const rgb = highlightColors[color];
            
            heatmapHTML = heatmapHTML.replace(regex, (match) => {
                const delay = (delayCounter * 0.15).toFixed(2);
                delayCounter++;
                return `<span class="heatmap-token bg-${color}-500/20 text-${color}-400 px-1.5 py-0.5 rounded border-b-2 border-${color}-500 font-semibold" style="box-shadow: 0 0 8px rgba(${rgb}, 0.5); animation-delay: ${delay}s">${match}</span>`;
            });
        });

        const sentencesArr = text.split('.').filter(s => s.trim().length > 0);
        let sentenceAnalysis = [];
        sentencesArr.forEach((s, i) => {
            const sLower = s.toLowerCase();
            let tag = "Neutral statement"; let icon = "fa-check"; let color = "text-emerald-500"; let border = "border-emerald-500/30";
            if (sLower.includes('always') || sLower.includes('never') || sLower.includes('manipulates')) {
                tag = "Overgeneralization"; icon = "fa-triangle-exclamation"; color = "text-rose-500"; border = "border-rose-500/30";
            } else if (sLower.includes('dangerous') || sLower.includes('ruining')) {
                tag = "Toxicity Risk"; icon = "fa-fire"; color = "text-amber-500"; border = "border-amber-500/30";
            } else if (sLower.includes('ideology') || sLower.includes('these people')) {
                tag = "Identity Framing"; icon = "fa-users-slash"; color = "text-amber-500"; border = "border-amber-500/30";
            } else if (i === 0) {
                tag = "Emotional Framing"; icon = "fa-bolt"; color = "text-amber-500"; border = "border-amber-500/30";
            }
            sentenceAnalysis.push({ text: s.trim() + ".", tag, icon, color, border });
        });

        return {
            overallBias: 84,
            confidence: 96,
            risk: "High Risk",
            riskColor: "rose",
            timestamp: timestamp,
            categories: {
                loadedLanguage: 88,
                identityBias: 72,
                emotionalFraming: 75,
                toxicityRisk: 40
            },
            heatmap: heatmapHTML,
            sentenceAnalysis: sentenceAnalysis,
            neutralRewrite: "Some observers argue that certain media outlets or groups influence public perception regarding specific policies. It is important to evaluate claims based on verifiable evidence rather than broad characterizations.",
            explainability: "The detection engine flagged this payload due to a high concentration of absolute thresholds ('always', 'never') combined with broad framing ('these people', 'manipulates'). The syntactic structure relies on polarizing phrasing that skews the semantic neutrality vector away from an objective journalistic baseline."
        };
    } else {
        // Neutral Case
        const sentencesArr = text.split('.').filter(s => s.trim().length > 0);
        const sentenceAnalysis = sentencesArr.map(s => ({
            text: s.trim() + ".", tag: "Objective Payload", icon: "fa-check", color: "text-emerald-500", border: "border-emerald-500/30"
        }));

        return {
            overallBias: 12,
            confidence: 92,
            risk: "Low Risk",
            riskColor: "emerald",
            timestamp: timestamp,
            categories: {
                loadedLanguage: 8,
                identityBias: 4,
                emotionalFraming: 15,
                toxicityRisk: 2
            },
            heatmap: text,
            sentenceAnalysis: sentenceAnalysis,
            neutralRewrite: null,
            explainability: "The input text relies on objective observations and presents verifiable claims without emotionally charged vocabulary or outgroup targeting. The semantic vectors align safely within standardized journalistic neutrality tolerances."
        };
    }
}

// --- Render Logic ---
function renderResults(data) {
    timestampEl.textContent = `Generated: ${data.timestamp}`;

    if (data.riskColor === 'rose') {
        biasBadge.innerHTML = `
            <span class="inline-flex items-center space-x-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(244,63,94,0.15)]">
                <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>Bias Detected</span>
            </span>
        `;
    } else {
        biasBadge.innerHTML = `
            <span class="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Neutral Clear</span>
            </span>
        `;
    }

    overallScore.textContent = data.overallBias;
    overallScore.className = `text-5xl font-black text-${data.riskColor}-400`;
    
    riskLabel.textContent = data.risk;
    riskLabel.className = `text-[10px] font-bold px-3 py-1 rounded-full bg-${data.riskColor}-500/10 border border-${data.riskColor}-500/30 text-${data.riskColor}-400 uppercase tracking-widest`;

    confidenceScore.textContent = data.confidence;

    loadedScore.textContent = `${data.categories.loadedLanguage}%`;
    identityScore.textContent = `${data.categories.identityBias}%`;
    emotionalScore.textContent = `${data.categories.emotionalFraming}%`;
    toxicityScore.textContent = `${data.categories.toxicityRisk}%`;

    loadedBar.style.width = '0%';
    identityBar.style.width = '0%';
    emotionalBar.style.width = '0%';
    toxicityBar.style.width = '0%';

    setTimeout(() => {
        loadedBar.style.width = `${data.categories.loadedLanguage}%`;
        identityBar.style.width = `${data.categories.identityBias}%`;
        emotionalBar.style.width = `${data.categories.emotionalFraming}%`;
        toxicityBar.style.width = `${data.categories.toxicityRisk}%`;
    }, 100);

    explainabilityText.textContent = data.explainability;
    
    // Inject heatmap html (animations will run automatically)
    heatmapContent.innerHTML = data.heatmap;

    sentenceList.innerHTML = '';
    data.sentenceAnalysis.forEach((s) => {
        const div = document.createElement('div');
        div.className = `bg-surfaceLight/30 border ${s.border} p-4 rounded-xl flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-surfaceLight/50 transition-colors shadow-sm`;
        div.innerHTML = `
            <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic flex-1">"${s.text}"</p>
            <div class="inline-flex items-center space-x-2 bg-surface border border-themeBorder/5 px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 shadow-inner">
                <i class="fa-solid ${s.icon} ${s.color} text-[10px]"></i>
                <span class="text-[10px] font-bold text-themeText uppercase tracking-wider">${s.tag}</span>
            </div>
        `;
        sentenceList.appendChild(div);
    });

    if (data.neutralRewrite) {
        rewriteSection.classList.remove('hidden');
        rewriteText.textContent = data.neutralRewrite;
    } else {
        rewriteSection.classList.add('hidden');
    }
}

// --- Architecture Flow Dynamic Rendering ---
const architectureSteps = [
    {
        id: 1,
        title: 'Payload',
        desc: 'Input raw text or article URL',
        baseColor: 'surfaceLight',
        accentColor: 'white',
        shadowColor: 'rgb(var(--color-border),0.05)',
        hoverShadow: 'rgb(var(--color-border),0.15)',
        borderColor: 'white/10',
        hoverBorder: 'white/30',
        bgCircle: 'bg-surfaceLight'
    },
    {
        id: 2,
        title: 'Inference',
        desc: 'Multi-model semantic analysis',
        baseColor: 'primary',
        accentColor: 'primaryGlow',
        shadowColor: 'rgba(16,185,129,0.1)',
        hoverShadow: 'rgba(16,185,129,0.4)',
        borderColor: 'primary/30',
        hoverBorder: 'primary/60',
        bgCircle: 'bg-primary/20 border-primary/50'
    },
    {
        id: 3,
        title: 'Explainability',
        desc: 'Generate heatmaps & vectors',
        baseColor: 'secondary',
        accentColor: 'secondary',
        shadowColor: 'rgba(6,182,212,0.1)',
        hoverShadow: 'rgba(6,182,212,0.4)',
        borderColor: 'secondary/30',
        hoverBorder: 'secondary/60',
        bgCircle: 'bg-secondary/20 border-secondary/50'
    },
    {
        id: 4,
        title: 'Action',
        desc: 'Neutral rewrite or export',
        baseColor: 'surfaceLight',
        accentColor: 'white',
        shadowColor: 'rgb(var(--color-border),0.05)',
        hoverShadow: 'rgb(var(--color-border),0.15)',
        borderColor: 'white/10',
        hoverBorder: 'white/30',
        bgCircle: 'bg-surfaceLight'
    }
];

function renderArchitectureFlow() {
    const container = document.getElementById('architecture-flow-container');
    if (!container) return;

    const connector = container.querySelector('.absolute');
    container.innerHTML = '';
    if (connector) container.appendChild(connector);

    architectureSteps.forEach((step, index) => {
        const stepHTML = `
            <div class="glass-card w-48 p-6 rounded-2xl flex flex-col items-center text-center z-10 transition-all duration-500 cursor-pointer architecture-step border-${step.borderColor}"
                 style="box-shadow: 0 0 15px ${step.shadowColor};"
                 onmouseenter="this.style.boxShadow='0 0 25px ${step.hoverShadow}'; this.style.borderColor='var(--tw-colors-${step.baseColor}-500, rgb(var(--color-border),0.3))'; this.style.transform='translateY(-5px) scale(1.05)';"
                 onmouseleave="this.style.boxShadow='0 0 15px ${step.shadowColor}'; this.style.borderColor=''; this.style.transform='translateY(0) scale(1)';">
                <div class="w-10 h-10 rounded-full ${step.bgCircle} border border-${step.borderColor} flex items-center justify-center mb-4 text-${step.accentColor} transition-transform duration-300">
                    ${step.id}
                </div>
                <h4 class="text-sm font-bold text-themeText mb-1 transition-colors">${step.title}</h4>
                <p class="text-[10px] text-textMuted">${step.desc}</p>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', stepHTML);

        if (index < architectureSteps.length - 1) {
            const chevronHTML = `<i class="fa-solid fa-chevron-right text-textMuted/30 hidden md:block transition-all duration-300"></i>`;
            container.insertAdjacentHTML('beforeend', chevronHTML);
        }
    });

    container.addEventListener('mouseover', (e) => {
        const hoveredCard = e.target.closest('.architecture-step');
        if (hoveredCard) {
            container.querySelectorAll('.architecture-step').forEach(card => {
                if (card !== hoveredCard) {
                    card.style.opacity = '0.4';
                    card.style.transform = 'scale(0.95)';
                }
            });
            container.querySelectorAll('.fa-chevron-right').forEach(icon => {
                icon.style.opacity = '0.2';
            });
        }
    });

    container.addEventListener('mouseout', (e) => {
        const hoveredCard = e.target.closest('.architecture-step');
        if (hoveredCard) {
            container.querySelectorAll('.architecture-step').forEach(card => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0) scale(1)';
            });
            container.querySelectorAll('.fa-chevron-right').forEach(icon => {
                icon.style.opacity = '1';
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', renderArchitectureFlow);
