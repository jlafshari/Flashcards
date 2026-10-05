// Flashcard Application
// Data model and state management

class FlashcardApp {
    constructor() {
        this.cards = [];
        this.currentCardIndex = 0;
        this.reviewedToday = 0;
        this.isFlipped = false;
        this.direction = 'bg-en'; // 'bg-en' or 'en-bg'
        
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.updateUI();
    }

    // Data management
    loadFromStorage() {
        const stored = localStorage.getItem('flashcards');
        if (stored) {
            this.cards = JSON.parse(stored);
        }
        
        const reviewDate = localStorage.getItem('reviewDate');
        const today = new Date().toDateString();
        
        if (reviewDate === today) {
            this.reviewedToday = parseInt(localStorage.getItem('reviewedToday') || '0');
        } else {
            this.reviewedToday = 0;
            localStorage.setItem('reviewDate', today);
            localStorage.setItem('reviewedToday', '0');
        }
        
        // Load direction preference
        const savedDirection = localStorage.getItem('studyDirection');
        if (savedDirection) {
            this.direction = savedDirection;
        }
    }

    saveToStorage() {
        localStorage.setItem('flashcards', JSON.stringify(this.cards));
    }

    addCard(bulgarian, english) {
        const card = {
            id: Date.now(),
            bulgarian: bulgarian.trim(),
            english: english.trim(),
            createdAt: new Date().toISOString()
        };
        
        this.cards.push(card);
        this.saveToStorage();
        this.updateUI();
        
        return card;
    }

    deleteCard(id) {
        this.cards = this.cards.filter(card => card.id !== id);
        this.saveToStorage();
        
        // Adjust current index if needed
        if (this.currentCardIndex >= this.cards.length) {
            this.currentCardIndex = Math.max(0, this.cards.length - 1);
        }
        
        this.updateUI();
    }

    // Navigation
    nextCard() {
        if (this.currentCardIndex < this.cards.length - 1) {
            this.currentCardIndex++;
            this.resetFlip();
            this.incrementReviewCount();
            this.updateUI();
        }
    }

    previousCard() {
        if (this.currentCardIndex > 0) {
            this.currentCardIndex--;
            this.resetFlip();
            this.updateUI();
        }
    }

    flipCard() {
        this.isFlipped = !this.isFlipped;
        const flashcard = document.getElementById('flashcard');
        
        if (this.isFlipped) {
            flashcard.classList.add('flipped');
            this.showFeedbackButtons();
        } else {
            flashcard.classList.remove('flipped');
            this.hideFeedbackButtons();
        }
    }

    resetFlip() {
        this.isFlipped = false;
        const flashcard = document.getElementById('flashcard');
        flashcard.classList.remove('flipped');
        this.hideFeedbackButtons();
    }

    incrementReviewCount() {
        this.reviewedToday++;
        localStorage.setItem('reviewedToday', this.reviewedToday.toString());
    }

    showFeedbackButtons() {
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('easy-btn').style.display = 'inline-block';
        document.getElementById('review-btn').style.display = 'inline-block';
    }

    hideFeedbackButtons() {
        document.getElementById('next-btn').style.display = 'inline-block';
        document.getElementById('easy-btn').style.display = 'none';
        document.getElementById('review-btn').style.display = 'none';
    }

    markEasy() {
        // Card was easy - increment review count and move to next
        this.nextCard();
    }

    markForReview() {
        // Card needs review - move to next card without incrementing review count
        // Future enhancement: could mark card with needsReview flag
        if (this.currentCardIndex < this.cards.length - 1) {
            this.currentCardIndex++;
            this.resetFlip();
            this.updateUI();
        }
    }

    // UI updates
    updateUI() {
        this.updateStudyTab();
        this.updateManageTab();
    }

    updateStudyTab() {
        // Update stats
        document.getElementById('total-cards').textContent = this.cards.length;
        document.getElementById('reviewed-today').textContent = this.reviewedToday;

        const noCardsMessage = document.getElementById('no-cards-message');
        const cardContainer = document.getElementById('card-container');

        if (this.cards.length === 0) {
            noCardsMessage.style.display = 'block';
            cardContainer.style.display = 'none';
            return;
        }

        noCardsMessage.style.display = 'none';
        cardContainer.style.display = 'block';

        const currentCard = this.cards[this.currentCardIndex];
        
        // Update direction buttons
        document.getElementById('direction-bg-en').classList.toggle('active', this.direction === 'bg-en');
        document.getElementById('direction-en-bg').classList.toggle('active', this.direction === 'en-bg');
        
        // Update card content based on direction
        if (this.direction === 'bg-en') {
            document.getElementById('card-front-lang').textContent = 'Bulgarian';
            document.getElementById('card-back-lang').textContent = 'English';
            document.getElementById('card-front-text').textContent = currentCard.bulgarian;
            document.getElementById('card-back-text').textContent = currentCard.english;
        } else {
            document.getElementById('card-front-lang').textContent = 'English';
            document.getElementById('card-back-lang').textContent = 'Bulgarian';
            document.getElementById('card-front-text').textContent = currentCard.english;
            document.getElementById('card-back-text').textContent = currentCard.bulgarian;
        }
        
        // Update position
        document.getElementById('card-position').textContent = 
            `${this.currentCardIndex + 1} / ${this.cards.length}`;

        // Update navigation buttons
        const isLastCard = this.currentCardIndex === this.cards.length - 1;
        document.getElementById('prev-btn').disabled = this.currentCardIndex === 0;
        document.getElementById('next-btn').disabled = isLastCard;
        document.getElementById('easy-btn').disabled = isLastCard;
        document.getElementById('review-btn').disabled = isLastCard;
    }

    updateManageTab() {
        document.getElementById('card-count').textContent = this.cards.length;
        
        const cardsList = document.getElementById('cards-list');
        
        if (this.cards.length === 0) {
            cardsList.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">No cards yet. Add your first card above!</p>';
            return;
        }

        cardsList.innerHTML = this.cards.map(card => `
            <div class="card-item">
                <div class="card-item-content">
                    <div class="card-item-front">${this.escapeHtml(card.bulgarian)}</div>
                    <div class="card-item-back">${this.escapeHtml(card.english)}</div>
                </div>
                <div class="card-item-actions">
                    <button class="btn btn-danger" onclick="app.deleteCard(${card.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Event listeners
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Direction switching
        document.getElementById('direction-bg-en').addEventListener('click', () => {
            this.setDirection('bg-en');
        });

        document.getElementById('direction-en-bg').addEventListener('click', () => {
            this.setDirection('en-bg');
        });

        // Study tab controls
        document.getElementById('flip-btn').addEventListener('click', () => {
            this.flipCard();
        });

        document.getElementById('prev-btn').addEventListener('click', () => {
            this.previousCard();
        });

        document.getElementById('next-btn').addEventListener('click', () => {
            this.nextCard();
        });

        document.getElementById('easy-btn').addEventListener('click', () => {
            this.markEasy();
        });

        document.getElementById('review-btn').addEventListener('click', () => {
            this.markForReview();
        });

        // Click on card to flip
        document.getElementById('flashcard').addEventListener('click', () => {
            this.flipCard();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            const activeTab = document.querySelector('.tab-content.active').id;
            
            if (activeTab === 'study-tab' && this.cards.length > 0) {
                if (e.key === 'ArrowLeft') {
                    this.previousCard();
                } else if (e.key === 'ArrowRight') {
                    this.nextCard();
                } else if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    this.flipCard();
                } else if (this.isFlipped) {
                    // Feedback shortcuts only work when card is flipped
                    if (e.key === '1') {
                        e.preventDefault();
                        const easyBtn = document.getElementById('easy-btn');
                        if (!easyBtn.disabled) {
                            this.markEasy();
                        }
                    } else if (e.key === '2') {
                        e.preventDefault();
                        const reviewBtn = document.getElementById('review-btn');
                        if (!reviewBtn.disabled) {
                            this.markForReview();
                        }
                    }
                }
            }
        });

        // Add card form
        const bulgarianInput = document.getElementById('bulgarian-input');
        const englishInput = document.getElementById('english-input');
        const addButton = document.getElementById('add-card-btn');

        addButton.addEventListener('click', () => {
            this.handleAddCard();
        });

        // Enter key in inputs
        bulgarianInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                englishInput.focus();
            }
        });

        englishInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddCard();
            }
        });
    }

    setDirection(direction) {
        this.direction = direction;
        localStorage.setItem('studyDirection', direction);
        this.resetFlip();
        this.updateUI();
    }

    handleAddCard() {
        const bulgarianInput = document.getElementById('bulgarian-input');
        const englishInput = document.getElementById('english-input');
        
        const bulgarian = bulgarianInput.value.trim();
        const english = englishInput.value.trim();

        if (!bulgarian || !english) {
            alert('Please fill in both Bulgarian and English fields');
            return;
        }

        this.addCard(bulgarian, english);
        
        // Clear inputs
        bulgarianInput.value = '';
        englishInput.value = '';
        bulgarianInput.focus();

        // Show success feedback
        const addButton = document.getElementById('add-card-btn');
        const originalText = addButton.textContent;
        addButton.textContent = '✓ Added!';
        addButton.style.background = '#4caf50';
        
        setTimeout(() => {
            addButton.textContent = originalText;
            addButton.style.background = '';
        }, 1000);
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            if (button.dataset.tab === tabName) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            if (content.id === `${tabName}-tab`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        // Reset flip state when switching to study tab
        if (tabName === 'study') {
            this.resetFlip();
        }
    }
}

// Initialize app
const app = new FlashcardApp();
