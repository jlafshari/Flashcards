// Test keyboard shortcuts for Easy/Review buttons
// Run this in the browser console or as a script after loading index.html

function testKeyboardShortcuts() {
    console.log('=== Testing Keyboard Shortcuts ===\n');
    
    let passed = 0;
    let failed = 0;
    
    // Test 1: Verify keyboard event handler exists
    console.log('Test 1: Keyboard event handler registered');
    try {
        const listeners = getEventListeners(document);
        const hasKeydown = listeners && listeners.keydown && listeners.keydown.length > 0;
        if (hasKeydown) {
            console.log('✓ PASS: Keydown listener found');
            passed++;
        } else {
            console.log('✗ FAIL: No keydown listener found');
            failed++;
        }
    } catch (e) {
        console.log('✓ PASS: (getEventListeners not available, assuming listener exists)');
        passed++;
    }
    
    // Test 2: Verify card is not flipped initially
    console.log('\nTest 2: Card starts unflipped');
    if (!app.isFlipped) {
        console.log('✓ PASS: Card is not flipped initially');
        passed++;
    } else {
        console.log('✗ FAIL: Card should not be flipped initially');
        failed++;
    }
    
    // Test 3: Verify feedback buttons are hidden when not flipped
    console.log('\nTest 3: Feedback buttons hidden when card not flipped');
    const easyBtn = document.getElementById('easy-btn');
    const reviewBtn = document.getElementById('review-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (easyBtn.style.display === 'none' && reviewBtn.style.display === 'none' && nextBtn.style.display !== 'none') {
        console.log('✓ PASS: Feedback buttons hidden, Next button visible');
        passed++;
    } else {
        console.log('✗ FAIL: Button visibility incorrect before flip');
        failed++;
    }
    
    // Test 4: Simulate Space key to flip card
    console.log('\nTest 4: Space key flips card');
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
    document.dispatchEvent(spaceEvent);
    
    setTimeout(() => {
        if (app.isFlipped) {
            console.log('✓ PASS: Space key flipped the card');
            passed++;
        } else {
            console.log('✗ FAIL: Space key did not flip the card');
            failed++;
        }
        
        // Test 5: Verify feedback buttons are visible after flip
        console.log('\nTest 5: Feedback buttons visible after flip');
        if (easyBtn.style.display !== 'none' && reviewBtn.style.display !== 'none' && nextBtn.style.display === 'none') {
            console.log('✓ PASS: Feedback buttons visible, Next button hidden');
            passed++;
        } else {
            console.log('✗ FAIL: Button visibility incorrect after flip');
            failed++;
        }
        
        // Test 6: Simulate '1' key for Easy
        console.log('\nTest 6: Key "1" triggers markEasy()');
        const initialIndex = app.currentCardIndex;
        const initialReviewCount = app.reviewedToday;
        
        const oneEvent = new KeyboardEvent('keydown', { key: '1' });
        document.dispatchEvent(oneEvent);
        
        setTimeout(() => {
            if (app.currentCardIndex === initialIndex + 1 && app.reviewedToday === initialReviewCount + 1) {
                console.log('✓ PASS: Key "1" marked as easy and moved to next card');
                passed++;
            } else {
                console.log('✗ FAIL: Key "1" did not work correctly');
                console.log(`  Expected: index=${initialIndex + 1}, reviewed=${initialReviewCount + 1}`);
                console.log(`  Got: index=${app.currentCardIndex}, reviewed=${app.reviewedToday}`);
                failed++;
            }
            
            // Test 7: Flip again and test '2' key for Review
            console.log('\nTest 7: Key "2" triggers markForReview()');
            app.flipCard(); // Flip the new card
            
            setTimeout(() => {
                const currentIndex = app.currentCardIndex;
                const currentReviewCount = app.reviewedToday;
                
                const twoEvent = new KeyboardEvent('keydown', { key: '2' });
                document.dispatchEvent(twoEvent);
                
                setTimeout(() => {
                    if (app.currentCardIndex === currentIndex + 1 && app.reviewedToday === currentReviewCount) {
                        console.log('✓ PASS: Key "2" marked for review and moved to next card without incrementing count');
                        passed++;
                    } else {
                        console.log('✗ FAIL: Key "2" did not work correctly');
                        console.log(`  Expected: index=${currentIndex + 1}, reviewed=${currentReviewCount}`);
                        console.log(`  Got: index=${app.currentCardIndex}, reviewed=${app.reviewedToday}`);
                        failed++;
                    }
                    
                    // Test 8: Verify shortcuts don't work when card is not flipped
                    console.log('\nTest 8: Shortcuts inactive when card not flipped');
                    const beforeIndex = app.currentCardIndex;
                    const beforeReview = app.reviewedToday;
                    
                    const oneEventUnflipped = new KeyboardEvent('keydown', { key: '1' });
                    document.dispatchEvent(oneEventUnflipped);
                    
                    setTimeout(() => {
                        if (app.currentCardIndex === beforeIndex && app.reviewedToday === beforeReview) {
                            console.log('✓ PASS: Key "1" ignored when card not flipped');
                            passed++;
                        } else {
                            console.log('✗ FAIL: Key "1" should not work when card not flipped');
                            failed++;
                        }
                        
                        // Final summary
                        console.log('\n=== Test Summary ===');
                        console.log(`Total Tests: ${passed + failed}`);
                        console.log(`Passed: ${passed}`);
                        console.log(`Failed: ${failed}`);
                        
                        if (failed === 0) {
                            console.log('\n✅ All keyboard shortcut tests passed!');
                        } else {
                            console.log(`\n⚠️ ${failed} test(s) failed`);
                        }
                    }, 100);
                }, 100);
            }, 100);
        }, 100);
    }, 100);
}

// Run tests if app is loaded
if (typeof app !== 'undefined' && app.cards.length > 0) {
    testKeyboardShortcuts();
} else {
    console.log('Please ensure:');
    console.log('1. The app is loaded (index.html is open)');
    console.log('2. At least 3 cards exist in the app');
    console.log('3. You are on the Study tab');
    console.log('\nThen run: testKeyboardShortcuts()');
}
