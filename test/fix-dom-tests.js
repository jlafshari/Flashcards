const fs = require('fs');
const path = require('path');

const domRelatedTests = [
    'test_bug_fixes.js',
    'test_debug_behavior.js',
    'test_debug_card_limit.js',
    'test_debug_navigation.js',
    'test_edit_node.js',
    'test_integration_two_step.js',
    'test_navigation_inconsistency.js',
    'test_queue_ordering.js',
    'test_review_queue_card_limit.js',
    'test_review_queue_navigation_fix.js',
    'test_session_feature.js',
    'test_session_ui_fix_node.js',
    'test_simple_flow.js',
    'test_update_card_display_fix.js'
];

let fixed = 0;

domRelatedTests.forEach(testFile => {
    const filePath = path.join(__dirname, testFile);
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${testFile} not found`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already has dom-mock
    if (content.includes('require(\'./dom-mock.js\')')) {
        console.log(`✓ ${testFile} already has dom-mock`);
        return;
    }
    
    // Add require at the top after shebang and comments
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find where to insert (after shebang and initial comments)
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('//') || lines[i].startsWith('#!/') || lines[i].trim() === '') {
            insertIndex = i + 1;
        } else {
            break;
        }
    }
    
    lines.splice(insertIndex, 0, "require('./dom-mock.js');", "");
    const newContent = lines.join('\n');
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✓ Fixed ${testFile}`);
    fixed++;
});

console.log(`\n✅ Fixed ${fixed} test files`);
