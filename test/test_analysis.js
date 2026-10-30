const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const failingTests = [
  'test_bug_fixes.js',
  'test_debug_behavior.js',
  'test_debug_card_limit.js',
  'test_debug_navigation.js',
  'test_edit_node.js',
  'test_final_verification.js',
  'test_integration_complete.js',
  'test_integration_final.js',
  'test_integration_two_step.js',
  'test_manage_category_filter.js',
  'test_merged_ui_integration.js',
  'test_navigation_inconsistency.js',
  'test_opacity.js',
  'test_pause_timer.js',
  'test_queue_ordering.js',
  'test_review_queue.js',
  'test_review_queue_card_limit.js',
  'test_review_queue_navigation_fix.js',
  'test_runner.js',
  'test_sample_cards.js',
  'test_session_feature.js',
  'test_session_features.js',
  'test_session_ui_fix_node.js',
  'test_shuffle_before_limit.js',
  'test_simple_flow.js',
  'test_unbury_opacity_fix.js',
  'test_update_card_display_fix.js',
  'test_visual_integration.js'
];

const errorTypes = {
  'DOM related': [],
  'Path issues': [],
  'Missing methods': [],
  'Other': []
};

failingTests.forEach(test => {
  try {
    execSync(`node ${test}`, { encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    const output = e.stdout + e.stderr;
    
    if (output.includes("document.querySelector") || 
        output.includes("addEventListener") ||
        output.includes("Cannot read properties of undefined")) {
      errorTypes['DOM related'].push(test);
    } else if (output.includes("ENOENT") || output.includes("no such file")) {
      errorTypes['Path issues'].push(test);
    } else if (output.includes("is not a function") || 
               output.includes("Cannot read properties")) {
      errorTypes['Missing methods'].push(test);
    } else {
      errorTypes['Other'].push(test);
    }
  }
});

console.log('\n╔════════════════════════════════════════╗');
console.log('║   Failing Tests Analysis              ║');
console.log('╚════════════════════════════════════════╝\n');

Object.entries(errorTypes).forEach(([type, tests]) => {
  if (tests.length > 0) {
    console.log(`\n${type} (${tests.length}):`);
    tests.forEach(t => console.log(`  - ${t}`));
  }
});
