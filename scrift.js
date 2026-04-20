/**
 * Shayari World - Main Application Logic
 */

// 1. DATABASE
const db = window.shayaridb;

// 2. STATE MANAGEMENT
const app = {
    currentView: 'home',
    currentMood: 'all',
    currentPoetId: null,
    searchQuery: '',

    init() {
        this.renderHome();
        this.setupNotification();
    },

    navigate(view, params = {}) {
        this.currentView = view;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        switch (view) {
            case 'home':
                this.renderHome();
                break;
            case 'poet':
                this.currentPoetId = params.id;
                this.renderPoetDetail();
                break;
            case 'ai-generator':
                this.renderAIGenerator();
                break;
        }
    },

    setMood(moodId) {
        this.currentMood = moodId;
        this.renderHome(); // Re-render home with filtered data
    },

    handleSearch(event) {
        this.searchQuery = event.target.value.trim().toLowerCase();
        this.renderHome();
        // Since we re-rerender, we need to manually refocus the input
        setTimeout(() => {
            const input = document.getElementById('global-search');
            if(input && document.activeElement !== input) {
                input.focus();
                // Move cursor to end
                input.setSelectionRange(input.value.length, input.value.length);
            }
        }, 0);
    },

    openModal(text, poetName) {
        const modal = document.getElementById('shayari-modal');
        const body = document.getElementById('modal-shayari-body');
        const formattedText = text.replace(/\\n/g, '<br>');
        body.innerHTML = formattedText + `<div id="modal-poet-name">- ${poetName}</div>`;
        modal.classList.add('open');
    },

    closeModal() {
        const modal = document.getElementById('shayari-modal');
        modal.classList.remove('open');
    },

    // 3. RENDERERS
    renderHome() {
        const content = document.getElementById('app-content');
        
        // Filter logic by mood
        let filteredShayari = this.currentMood === 'all' 
            ? db.shayari 
            : db.shayari.filter(s => s.mood === this.currentMood);
            
        // Filter logic by search
        if(this.searchQuery) {
            filteredShayari = filteredShayari.filter(s => {
                const poet = db.poets.find(p => p.id === s.poetId);
                const poetMatch = poet && poet.name.toLowerCase().includes(this.searchQuery);
                const textMatch = s.text.toLowerCase().includes(this.searchQuery);
                return poetMatch || textMatch;
            });
        }
            
        // Get poets relevant to the mood and search
        let relevantPoetIds = [...new Set(filteredShayari.map(s => s.poetId))];
        let relevantPoets = this.currentMood === 'all' && !this.searchQuery
            ? db.poets
            : db.poets.filter(p => relevantPoetIds.includes(p.id));

        content.innerHTML = `
            <div class="view active fade-in">
                <div class="hero">
                    <h1>Feel Poetry, <span>Feel Emotion 🌙</span></h1>
                    <p>Discover the finest collection of Urdu and Hindi Shayari</p>
                    
                    <div class="mood-selector">
                        ${db.moods.map(m => `
                            <button class="mood-btn ${this.currentMood === m.id ? 'active-mood' : ''}" 
                                    onclick="app.setMood('${m.id}')">
                                ${m.icon} ${m.label}
                            </button>
                        `).join('')}
                    </div>
                </div>

                ${relevantPoets.length > 0 ? `
                <h2 class="section-title">Featured Poets</h2>
                <div class="poets-grid">
                    ${relevantPoets.map(poet => `
                        <div class="poet-card glass" onclick="app.navigate('poet', {id: '${poet.id}'})">
                            <div class="poet-avatar">${poet.image ? `<img src="${poet.image}" alt="${poet.name}">` : poet.name.charAt(0)}</div>
                            <div class="poet-name">${poet.name}</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <h2 class="section-title">Trending Shayari</h2>
                <div class="shayari-grid">
                    ${filteredShayari.map(s => this.createShayariCardHTML(s)).join('')}
                    ${filteredShayari.length === 0 ? '<p style="text-align:center;width:100%;">No shayari found for this mood currently.</p>' : ''}
                </div>
            </div>
        `;
    },

    renderPoetDetail() {
        const content = document.getElementById('app-content');
        const poet = db.poets.find(p => p.id === this.currentPoetId);
        const poetShayari = db.shayari.filter(s => s.poetId === poet.id);

        content.innerHTML = `
            <div class="view active fade-in">
                <button class="back-btn" onclick="app.navigate('home')"><i class="fa-solid fa-arrow-left"></i> Back to Home</button>
                
                <div class="poet-header">
                    <div class="poet-avatar glass">${poet.image ? `<img src="${poet.image}" alt="${poet.name}">` : poet.name.charAt(0)}</div>
                    <h2>${poet.name}</h2>
                    <p class="poet-bio">${poet.bio}</p>
                </div>

                <div class="shayari-grid">
                    ${poetShayari.map(s => this.createShayariCardHTML(s)).join('')}
                </div>
            </div>
        `;
    },

    renderAIGenerator() {
        const content = document.getElementById('app-content');
        
        content.innerHTML = `
            <div class="view active fade-in">
                <div class="hero">
                    <h1 class="typing-line">AI Shayari Generator 🤖</h1>
                    <p>Create completely unique poetry instantly based on your mood and topic.</p>
                </div>

                <div class="generator-container glass">
                    <div class="form-group">
                        <label>Select Mood</label>
                        <select id="ai-mood" class="form-control">
                            <option value="romantic">Romantic 💖</option>
                            <option value="sad">Sad 😔</option>
                            <option value="motivational">Motivational 🔥</option>
                            <option value="philosophical">Philosophical 🧠</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Language</label>
                        <select id="ai-lang" class="form-control">
                            <option value="hinglish">Hinglish</option>
                            <option value="hindi">Hindi</option>
                            <option value="urdu">Urdu</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Topic / Keyword (Optional)</label>
                        <input type="text" id="ai-topic" class="form-control" placeholder="e.g., Rain, Broken Heart, Success...">
                    </div>

                    <button class="generate-btn" onclick="app.generateShayari()">Generate ✨</button>
                    
                    <div class="spinner" id="ai-spinner"></div>
                    
                    <div id="ai-result" style="display:none; margin-top:2rem;">
                        <!-- Generated Card will appear here -->
                    </div>
                </div>
            </div>
        `;
    },

    createShayariCardHTML(shayariObj, isAI = false) {
        const poetName = isAI ? 'AI Generated' : db.poets.find(p => p.id === shayariObj.poetId).name;
        // Escape quotes for inline event handlers
        const escapedText = shayariObj.text.replace(/"/g, '&quot;').replace(/\n/g, '\\n');
        // Escape for literal passing
        const cleanName = poetName.replace(/"/g, '&quot;');
        
        return `
            <div class="shayari-card glass" id="card-${shayariObj.id || 'ai'}" onclick="app.openModal('${escapedText}', '${cleanName}')">
                <div class="shayari-card-content">${shayariObj.text}</div>
                <div class="shayari-meta">- ${poetName}</div>
                <div class="card-actions">
                    <button class="action-btn" title="Copy" onclick="event.stopPropagation(); app.copyToClipboard('${escapedText}')"><i class="fa-regular fa-copy"></i></button>
                    <button class="action-btn" title="Download Image" onclick="event.stopPropagation(); app.downloadCard('card-${shayariObj.id || 'ai'}')"><i class="fa-solid fa-download"></i></button>
                    <button class="action-btn" title="Share" onclick="event.stopPropagation(); app.shareShayari('${escapedText}')"><i class="fa-solid fa-share-nodes"></i></button>
                </div>
            </div>
        `;
    },

    // 4. FUNCTIONALITIES
    
    showNotification(msg) {
        let notif = document.getElementById('global-notif');
        if(!notif) {
            notif = document.createElement('div');
            notif.id = 'global-notif';
            notif.className = 'notification';
            document.body.appendChild(notif);
        }
        notif.textContent = msg;
        notif.classList.add('show');
        setTimeout(() => notif.classList.remove('show'), 3000);
    },

    setupNotification() {
        // dummy init
    },

    copyToClipboard(text) {
        const realText = text.replace(/\\n/g, '\n');
        navigator.clipboard.writeText(realText).then(() => {
            this.showNotification('Copied to clipboard! ✓');
        }).catch(err => {
            console.error('Copy failed', err);
        });
    },

    async shareShayari(text) {
        const realText = text.replace(/\\n/g, '\n');
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Shayari World',
                    text: realText + '\n\nRead more at ShayariWorld.com 🌙',
                    url: window.location.href
                });
            } catch (err) {
                console.log('Error sharing', err);
            }
        } else {
            this.copyToClipboard(text);
            this.showNotification('Link/Text copied for sharing!');
        }
    },

    downloadCard(cardId) {
        this.showNotification('Generating image... please wait.');
        const originalCard = document.getElementById(cardId);
        
        // Create a dedicated wrapper for rendering to ensure consistent styling regardless of screen size
        const cloneContainer = document.getElementById('canvas-clone-container');
        cloneContainer.innerHTML = '';
        
        const clone = originalCard.cloneNode(true);
        // Remove interactive buttons before taking screenshot
        const actions = clone.querySelector('.card-actions');
        if(actions) actions.remove();
        
        // Ensure glassmorphism renders better in canvas (HTML2Canvas sometimes struggles with heavy backdrop-filter)
        clone.style.background = 'linear-gradient(135deg, #1f1138, #0a0614)';
        clone.style.border = '1px solid #d4af37';
        clone.style.width = '100%';
        clone.style.height = 'auto';
        clone.style.padding = '40px';
        clone.style.transform = 'none'; // remove hover transform
        
        // Add Watermark
        const watermark = document.createElement('div');
        watermark.className = 'watermark';
        watermark.innerHTML = 'ShayariWorld.com 🌙';
        clone.appendChild(watermark);

        cloneContainer.appendChild(clone);

        // Wait a small tick then render
        setTimeout(() => {
            html2canvas(clone, {
                backgroundColor: null,
                scale: 2 // High Resolution
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = 'ShayariWorld.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
                cloneContainer.innerHTML = ''; // Cleanup
            }).catch(err => {
                console.error("Download failed:", err);
                this.showNotification('Failed to generate image.');
            });
        }, 100);
    },

    // 5. AI GENERATOR SIMULATION
    async generateShayari() {
        const spinner = document.getElementById('ai-spinner');
        const resultContainer = document.getElementById('ai-result');
        const mood = document.getElementById('ai-mood').value;
        const topic = document.getElementById('ai-topic').value || 'life';
        
        spinner.style.display = 'block';
        resultContainer.style.display = 'none';

        /* 
        =========================================================
        API INTEGRATION BLOCK (PLACEHOLDER)
        =========================================================
        To use real AI, uncomment the below fetch request and 
        add your actual API Key. 

        const API_KEY = 'YOUR_API_KEY_HERE';
        const prompt = \`Generate a 2-line \${mood} shayari in Hindi/Urdu about \${topic}.\`;
        
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': \`Bearer \${API_KEY}\`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{role: 'user', content: prompt}]
                })
            });
            const data = await response.json();
            const aiText = data.choices[0].message.content;
        }
        =========================================================
        */

        // Simulating API Latency
        setTimeout(() => {
            spinner.style.display = 'none';
            
            // Dummy logic to return a relevant shayari mock
            let mockResult = "";
            if(mood === 'sad') {
                mockResult = `Tumhari yaad mein jo aansu gire bariish ban kar,\n${topic} beh gaya unme bina kuch soche samjhe.`;
            } else if (mood === 'motivational') {
                mockResult = `${topic} ki talash mein tu rukna mat aey musafir,\nManzilein unhi ko milti hain jo safar nahi chhodte.`;
            } else if (mood === 'romantic') {
                mockResult = `Tere zikr ke bina meri dastaan adhoori hai,\nJaise ${topic} ke bina fiza mein nami adhoori hai.`;
            } else {
                mockResult = `Har rang mein khuda ki karigari dekhi hai,\nJab ${topic} ko gaur se mehsoos kiya humne.`;
            }

            const aiShayariObj = { text: mockResult };
            resultContainer.innerHTML = this.createShayariCardHTML(aiShayariObj, true);
            resultContainer.style.display = 'block';
            
            // Re-bind click handlers manually for dynamic HTML insertion
            resultContainer.className = 'fade-in';
        }, 1500);
    }
};

// Initialize Application once DOM is Ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
