#!/bin/bash
# Simple integration test to verify the app works

echo "=== Flashcards App Integration Test ==="
echo ""

# Check files exist
echo "Checking files..."
if [ ! -f "../source/index.html" ]; then
    echo "❌ index.html not found"
    exit 1
fi
if [ ! -f "../source/app.js" ]; then
    echo "❌ app.js not found"
    exit 1
fi
if [ ! -f "../source/styles.css" ]; then
    echo "❌ styles.css not found"
    exit 1
fi
echo "✓ All files present"
echo ""

# Check JavaScript syntax
echo "Checking JavaScript syntax..."
node -c ../source/app.js
if [ $? -ne 0 ]; then
    echo "❌ JavaScript syntax error"
    exit 1
fi
echo "✓ JavaScript syntax OK"
echo ""

# Run validation
echo "Running HTML validation..."
node validate_html.js
if [ $? -ne 0 ]; then
    echo "❌ HTML validation failed"
    exit 1
fi
echo ""

# Run category tests
echo "Running category feature tests..."
node test_category.js
if [ $? -ne 0 ]; then
    echo "❌ Category tests failed"
    exit 1
fi
echo ""

# Run import/export tests
echo "Running import/export tests..."
node test_import_export.js
if [ $? -ne 0 ]; then
    echo "❌ Import/export tests failed"
    exit 1
fi
echo ""

# Run CSV parsing tests
echo "Running CSV parsing tests..."
node test_csv_parsing.js
if [ $? -ne 0 ]; then
    echo "❌ CSV parsing tests failed"
    exit 1
fi
echo ""

# Check test CSV file exists
echo "Checking test files..."
if [ ! -f "test_import_categories.csv" ]; then
    echo "❌ test_import_categories.csv not found"
    exit 1
fi
echo "✓ Test CSV files present"
echo ""

echo "=== All Integration Tests Passed ==="
echo ""
echo "Manual testing required:"
echo "1. Open ../source/index.html in a browser"
echo "2. Follow ../documentation/CATEGORY_TESTING.md for manual tests"
echo "3. Test import using test_import_categories.csv"
echo ""
