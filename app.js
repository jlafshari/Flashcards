// Flashcard Application
// Data model and state management

class FlashcardApp {
    constructor() {
        this.cards = [];
        this.currentCardIndex = 0;
        this.reviewedToday = 0;
        this.isFlipped = false;
        this.direction = 'bg-en'; // 'bg-en' or 'en-bg'
        this.activeCategories = []; // Empty means show all categories
        this.reviewQueue = []; // Cards marked for review again
        this.lastCardId = 0; // Counter to ensure unique IDs even in rapid succession
        
        // Study session state
        this.inSession = false; // Whether a study session is active
        this.sessionCards = []; // Cards to review in this session (snapshot)
        this.sessionReviewedCards = new Set(); // IDs of cards reviewed in current session
        
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.loadCategoryPreference();
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

    addCard(bulgarian, english, category = '') {
        // Generate a unique ID using timestamp + counter to avoid collisions
        const timestamp = Date.now();
        this.lastCardId = Math.max(timestamp, this.lastCardId + 1);
        
        const card = {
            id: this.lastCardId,
            bulgarian: bulgarian.trim(),
            english: english.trim(),
            category: category.trim(),
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

    // Session management
    startSession() {
        // Start actual session with selected options
        const filteredCards = this.getFilteredCards();
        if (filteredCards.length === 0) {
            alert('No cards match the selected categories. Please select at least one category with cards.');
            return;
        }
        
        this.inSession = true;
        this.sessionCards = filteredCards; // Snapshot of filtered cards
        this.sessionReviewedCards = new Set();
        this.currentCardIndex = 0;
        this.reviewQueue = []; // Clear review queue for new session
        this.resetFlip();
        this.updateUI();
    }

    endSession() {
        this.inSession = false;
        this.sessionCards = [];
        this.sessionReviewedCards = new Set();
        this.reviewQueue = []; // Clear review queue
        this.resetFlip();
        this.updateUI();
    }

    isSessionComplete() {
        if (!this.inSession) return false;
        
        // Session is complete when all cards have been reviewed
        return this.sessionCards.every(card => this.sessionReviewedCards.has(card.id));
    }

    // Navigation
    nextCard() {
        const filteredCards = this.inSession ? this.sessionCards : this.getFilteredCards();
        if (this.currentCardIndex < filteredCards.length - 1) {
            this.currentCardIndex++;
            this.resetFlip();
            this.incrementReviewCount();
            this.updateUI();
        } else if (this.inSession) {
            // If we're at the last card in a session, check if session is complete
            if (this.isSessionComplete()) {
                this.showSessionComplete();
            }
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
        // Show animation first, then navigate after animation completes
        this.animateButton('easy-btn');
        
        // Delay navigation to allow animation to complete
        setTimeout(() => {
            // Mark card as reviewed in session
            if (this.inSession) {
                const currentCard = this.sessionCards[this.currentCardIndex];
                if (currentCard) {
                    this.sessionReviewedCards.add(currentCard.id);
                }
            }
            
            // Card was easy - increment review count and move to next
            this.nextCard();
        }, 300);
    }

    markForReview() {
        // Show animation first, then navigate after animation completes
        this.animateButton('review-btn');
        
        // Delay navigation to allow animation to complete
        setTimeout(() => {
            if (this.inSession) {
                // In session mode: add to review queue within session
                const currentCard = this.sessionCards[this.currentCardIndex];
                
                if (currentCard && !this.reviewQueue.includes(currentCard.id)) {
                    this.reviewQueue.push(currentCard.id);
                    
                    // Mark as reviewed (we'll see it again at the end)
                    this.sessionReviewedCards.add(currentCard.id);
                    
                    // After adding to queue, the card moves to the end of the session cards.
                    // The card that was next is now at the current index, so we don't need
                    // to increment currentCardIndex. We just reset and update UI.
                    this.resetFlip();
                    this.updateUI();
                } else {
                    // If card is already in queue or doesn't exist, just move to next card
                    if (this.currentCardIndex < this.sessionCards.length - 1) {
                        this.currentCardIndex++;
                        this.resetFlip();
                        this.updateUI();
                    }
                }
            } else {
                // Not in session mode: use existing behavior
                const filteredCards = this.getFilteredCards();
                const currentCard = filteredCards[this.currentCardIndex];
                
                if (currentCard && !this.reviewQueue.includes(currentCard.id)) {
                    this.reviewQueue.push(currentCard.id);
                    
                    // After adding to queue, the card moves to the end of the filtered list.
                    // The card that was next is now at the current index, so we don't need
                    // to increment currentCardIndex. We just reset and update UI.
                    this.resetFlip();
                    this.updateUI();
                } else {
                    // If card is already in queue or doesn't exist, just move to next card
                    if (this.currentCardIndex < filteredCards.length - 1) {
                        this.currentCardIndex++;
                        this.resetFlip();
                        this.updateUI();
                    }
                }
            }
        }, 300);
    }

    animateButton(buttonId) {
        const button = document.getElementById(buttonId);
        button.classList.add('animating');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            button.classList.remove('animating');
        }, 300);
    }

    // Category management
    getCategories() {
        // Get unique categories from all cards
        const categories = new Set();
        this.cards.forEach(card => {
            const category = card.category || '';
            categories.add(category);
        });
        return Array.from(categories).sort();
    }

    setActiveCategories(categories) {
        this.activeCategories = categories;
        localStorage.setItem('activeCategories', JSON.stringify(categories));
        this.currentCardIndex = 0; // Reset to first card when filter changes
        this.reviewQueue = []; // Clear review queue when filter changes
        this.resetFlip();
        this.updateUI();
    }

    getFilteredCards() {
        // In session mode, return session cards with review queue ordering
        if (this.inSession) {
            // If there are cards in the review queue, reorganize the deck
            if (this.reviewQueue.length > 0) {
                const queuedCardIds = new Set(this.reviewQueue);
                
                // Split into non-queued and queued groups
                const nonQueuedCards = [];
                const queuedCards = [];
                
                for (const card of this.sessionCards) {
                    if (queuedCardIds.has(card.id)) {
                        queuedCards.push(card);
                    } else {
                        nonQueuedCards.push(card);
                    }
                }
                
                // Return non-queued cards first, then queued cards at the end
                return [...nonQueuedCards, ...queuedCards];
            }
            
            return this.sessionCards;
        }
        
        // Get base filtered cards by category
        let filteredCards;
        if (this.activeCategories.length === 0) {
            filteredCards = this.cards;
        } else {
            filteredCards = this.cards.filter(card => {
                const category = card.category || '';
                return this.activeCategories.includes(category);
            });
        }
        
        // If there are cards in the review queue, reorganize the deck
        if (this.reviewQueue.length > 0) {
            // Create a Set of queued card IDs for fast lookup
            const queuedCardIds = new Set(this.reviewQueue);
            
            // Split filtered cards into two groups:
            // 1. Cards NOT in the queue (keep in original order)
            // 2. Cards in the queue (will be appended at the end)
            const nonQueuedCards = [];
            const queuedCards = [];
            
            for (const card of filteredCards) {
                if (queuedCardIds.has(card.id)) {
                    queuedCards.push(card);
                } else {
                    nonQueuedCards.push(card);
                }
            }
            
            // Return non-queued cards first, then queued cards at the end
            return [...nonQueuedCards, ...queuedCards];
        }
        
        return filteredCards;
    }

    loadCategoryPreference() {
        const saved = localStorage.getItem('activeCategories');
        if (saved) {
            try {
                this.activeCategories = JSON.parse(saved);
            } catch (e) {
                this.activeCategories = [];
            }
        }
    }

    // UI updates
    updateUI() {
        this.updateStudyTab();
        this.updateManageTab();
    }

    updateStudyTab() {
        const noCardsMessage = document.getElementById('no-cards-message');
        const cardContainer = document.getElementById('card-container');
        const startSessionBtn = document.getElementById('start-session-btn');
        const endSessionBtn = document.getElementById('end-session-btn');
        const studyOptions = document.getElementById('study-options');

        // Show filtered count (or session cards count when in session)
        const displayCount = this.inSession ? this.sessionCards.length : this.getFilteredCards().length;
        document.getElementById('total-cards').textContent = displayCount;
        document.getElementById('reviewed-today').textContent = this.reviewedToday;

        // Check if we have any cards at all
        if (this.cards.length === 0) {
            noCardsMessage.style.display = 'block';
            cardContainer.style.display = 'none';
            if (studyOptions) studyOptions.style.display = 'none';
            if (startSessionBtn) startSessionBtn.style.display = 'none';
            if (endSessionBtn) endSessionBtn.style.display = 'none';
            return;
        }

        noCardsMessage.style.display = 'none';
        
        if (this.inSession) {
            // State 2: In session - show card and controls, hide options and start button
            cardContainer.style.display = 'block';
            if (studyOptions) studyOptions.style.display = 'none';
            if (startSessionBtn) startSessionBtn.style.display = 'none';
            if (endSessionBtn) endSessionBtn.style.display = 'inline-block';
            
            // Update the card display
            this.updateCardDisplay();
        } else {
            // State 1: Initial/Not in session - show options and start button, hide card
            cardContainer.style.display = 'none';
            if (studyOptions) studyOptions.style.display = 'flex';
            if (startSessionBtn) {
                startSessionBtn.style.display = 'inline-block';
                startSessionBtn.textContent = 'Start Study Session';
            }
            if (endSessionBtn) endSessionBtn.style.display = 'none';
            
            // Update category filter display when showing options
            this.updateCategoryFilterDisplay();
            
            // Update direction button active states when showing options
            document.getElementById('direction-bg-en').classList.toggle('active', this.direction === 'bg-en');
            document.getElementById('direction-en-bg').classList.toggle('active', this.direction === 'en-bg');
        }
    }
    
    updateCardDisplay() {
        // Get filtered cards based on session cards
        const filteredCards = this.sessionCards;
        
        if (filteredCards.length === 0) {
            return;
        }

        // Ensure current index is within bounds
        if (this.currentCardIndex >= filteredCards.length) {
            this.currentCardIndex = 0;
        }

        const currentCard = filteredCards[this.currentCardIndex];
        
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
            `${this.currentCardIndex + 1} / ${filteredCards.length}`;

        // Update navigation buttons
        const isLastCard = this.currentCardIndex === filteredCards.length - 1;
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
                    ${card.category ? `<div class="card-item-category">Category: ${this.escapeHtml(card.category)}</div>` : ''}
                </div>
                <div class="card-item-actions">
                    <button class="btn btn-danger" onclick="app.deleteCard(${card.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    updateCategoryFilterDisplay() {
        const filterContainer = document.getElementById('category-filter');
        if (!filterContainer) return;

        const categories = this.getCategories();
        
        if (categories.length === 0 || (categories.length === 1 && categories[0] === '')) {
            // No categories or only empty category - hide filter
            filterContainer.style.display = 'none';
            return;
        }

        filterContainer.style.display = 'block';
        
        const checkboxesContainer = document.getElementById('category-checkboxes');
        checkboxesContainer.innerHTML = categories.map(category => {
            const displayName = category || 'Uncategorized';
            const isChecked = this.activeCategories.length === 0 || this.activeCategories.includes(category);
            return `
                <label class="category-checkbox">
                    <input type="checkbox" value="${this.escapeHtml(category)}" ${isChecked ? 'checked' : ''}>
                    <span>${this.escapeHtml(displayName)}</span>
                </label>
            `;
        }).join('');

        // Add event listeners to checkboxes
        checkboxesContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.handleCategoryFilterChange();
            });
        });
    }

    handleCategoryFilterChange() {
        const checkboxes = document.querySelectorAll('#category-checkboxes input[type="checkbox"]');
        const selectedCategories = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        
        // If all are checked or none are checked, show all
        const allCategories = this.getCategories();
        if (selectedCategories.length === 0 || selectedCategories.length === allCategories.length) {
            this.setActiveCategories([]);
        } else {
            this.setActiveCategories(selectedCategories);
        }
    }

    showSessionComplete() {
        const filteredCards = this.sessionCards;
        const reviewedCount = filteredCards.length;
        alert(`Session complete! You reviewed ${reviewedCount} card${reviewedCount !== 1 ? 's' : ''}.`);
        this.endSession();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Import/Export functionality
    exportCards() {
        if (this.cards.length === 0) {
            alert('No cards to export!');
            return;
        }

        // Generate CSV content: English in column 1, Bulgarian in column 2, Category in column 3
        const csvContent = this.cards.map(card => {
            const english = this.escapeCsvField(card.english);
            const bulgarian = this.escapeCsvField(card.bulgarian);
            const category = this.escapeCsvField(card.category || '');
            return `${english},${bulgarian},${category}`;
        }).join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute('href', url);
        link.setAttribute('download', `flashcards-export-${date}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    escapeCsvField(field) {
        // If field contains comma, quote, or newline, wrap in quotes and escape quotes
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
    }

    parseCSV(text) {
        const rows = [];
        let currentRow = [];
        let currentField = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (inQuotes) {
                if (char === '"') {
                    if (nextChar === '"') {
                        // Escaped quote
                        currentField += '"';
                        i++; // Skip next quote
                    } else {
                        // End of quoted field
                        inQuotes = false;
                    }
                } else {
                    currentField += char;
                }
            } else {
                if (char === '"') {
                    // Start of quoted field
                    inQuotes = true;
                } else if (char === ',') {
                    // Field separator
                    currentRow.push(currentField.trim());
                    currentField = '';
                } else if (char === '\n') {
                    // Row separator
                    currentRow.push(currentField.trim());
                    if (currentRow.some(field => field !== '')) {
                        rows.push(currentRow);
                    }
                    currentRow = [];
                    currentField = '';
                } else if (char === '\r') {
                    // Skip \r (handle \r\n line endings)
                    continue;
                } else {
                    currentField += char;
                }
            }
        }

        // Add last field and row
        if (currentField !== '' || currentRow.length > 0) {
            currentRow.push(currentField.trim());
            if (currentRow.some(field => field !== '')) {
                rows.push(currentRow);
            }
        }

        return rows;
    }

    validateCardData(english, bulgarian, category = '') {
        return english && bulgarian && 
               typeof english === 'string' && typeof bulgarian === 'string' &&
               english.trim() !== '' && bulgarian.trim() !== '';
    }

    isDuplicate(english, bulgarian, category = '') {
        return this.cards.some(card => 
            card.english.toLowerCase() === english.toLowerCase() && 
            card.bulgarian.toLowerCase() === bulgarian.toLowerCase() &&
            (card.category || '').toLowerCase() === category.toLowerCase()
        );
    }

    importCards(file, replace = false) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const rows = this.parseCSV(text);

                if (rows.length === 0) {
                    alert('CSV file is empty!');
                    return;
                }

                let importedCount = 0;
                let skippedCount = 0;
                const newCards = [];

                for (const row of rows) {
                    if (row.length < 2) {
                        continue; // Skip rows with less than 2 columns
                    }

                    const english = row[0];
                    const bulgarian = row[1];
                    const category = row.length >= 3 ? row[2] : ''; // Parse third column as category

                    if (!this.validateCardData(english, bulgarian, category)) {
                        continue; // Skip invalid cards
                    }

                    if (!replace && this.isDuplicate(english, bulgarian, category)) {
                        skippedCount++;
                        continue; // Skip duplicates when merging
                    }

                    newCards.push({
                        id: Date.now() + importedCount,
                        english: english.trim(),
                        bulgarian: bulgarian.trim(),
                        category: category.trim(),
                        createdAt: new Date().toISOString()
                    });
                    importedCount++;
                }

                if (replace) {
                    this.cards = newCards;
                } else {
                    this.cards.push(...newCards);
                }

                this.saveToStorage();
                this.updateUI();

                // Show feedback
                let message = `Successfully imported ${importedCount} card${importedCount !== 1 ? 's' : ''}`;
                if (skippedCount > 0) {
                    message += ` (${skippedCount} duplicate${skippedCount !== 1 ? 's' : ''} skipped)`;
                }
                alert(message);

            } catch (error) {
                alert('Failed to import CSV file. Please check the file format.');
                console.error('Import error:', error);
            }
        };

        reader.onerror = () => {
            alert('Failed to read file.');
        };

        reader.readAsText(file);
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

        // Session management
        const startSessionBtn = document.getElementById('start-session-btn');
        if (startSessionBtn) {
            startSessionBtn.addEventListener('click', () => {
                this.startSession();
            });
        }

        const endSessionBtn = document.getElementById('end-session-btn');
        if (endSessionBtn) {
            endSessionBtn.addEventListener('click', () => {
                this.endSession();
            });
        }

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
            
            // Keyboard shortcuts only work in study tab when in a session
            if (activeTab === 'study-tab' && this.inSession && this.cards.length > 0) {
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
        const categoryInput = document.getElementById('category-input');
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
                categoryInput.focus();
            }
        });

        categoryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddCard();
            }
        });

        // Import/Export buttons
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportCards();
        });

        document.getElementById('import-merge-btn').addEventListener('click', () => {
            document.getElementById('import-file-input').click();
            document.getElementById('import-file-input').dataset.mode = 'merge';
        });

        document.getElementById('import-replace-btn').addEventListener('click', () => {
            const confirmed = confirm('This will delete all existing cards and replace them with imported cards. Continue?');
            if (confirmed) {
                document.getElementById('import-file-input').click();
                document.getElementById('import-file-input').dataset.mode = 'replace';
            }
        });

        document.getElementById('import-file-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const mode = e.target.dataset.mode || 'merge';
                this.importCards(file, mode === 'replace');
                // Reset file input so same file can be selected again
                e.target.value = '';
            }
        });
    }

    setDirection(direction) {
        // Don't allow direction changes during an active session
        // But allow them when showing options (before session starts)
        if (this.inSession) {
            return;
        }
        
        this.direction = direction;
        localStorage.setItem('studyDirection', direction);
        this.reviewQueue = []; // Clear review queue when direction changes
        this.resetFlip();
        this.updateUI();
    }

    handleAddCard() {
        const bulgarianInput = document.getElementById('bulgarian-input');
        const englishInput = document.getElementById('english-input');
        const categoryInput = document.getElementById('category-input');
        
        const bulgarian = bulgarianInput.value.trim();
        const english = englishInput.value.trim();
        const category = categoryInput.value.trim();

        if (!bulgarian || !english) {
            alert('Please fill in both Bulgarian and English fields');
            return;
        }

        this.addCard(bulgarian, english, category);
        
        // Clear inputs
        bulgarianInput.value = '';
        englishInput.value = '';
        categoryInput.value = '';
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
        // End session and clear review queue when leaving study tab
        if (tabName !== 'study') {
            if (this.inSession) {
                this.endSession();
            }
            this.reviewQueue = [];
        }
        
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
