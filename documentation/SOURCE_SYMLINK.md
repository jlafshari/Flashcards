# Source Symlink Explanation

## What is it?

The `source` file in the root directory is a **symbolic link** (symlink) that points to `.` (the current directory, i.e., the repository root).

```
source -> .
```

## Why does it exist?

The repository's test suite (39 out of 56 test files) was written to reference application files using the path pattern `../source/` instead of `../`. For example:

- `../source/app.js` instead of `../app.js`
- `../source/index.html` instead of `../index.html`
- `../source/styles.css` instead of `../styles.css`

This is a common pattern in test suites where:
1. Source files live in a dedicated directory (e.g., `src/`, `source/`, or `lib/`)
2. Test files reference them using a consistent path

However, **this repository doesn't actually have a source directory** - the main application files (`app.js`, `index.html`, `styles.css`) are at the root level.

## Why not just remove it?

To remove the symlink, we would need to:
1. Update 39+ test files to change `../source/` to `../`
2. Ensure no tests break during the migration
3. Test all HTML-based tests that load files via relative paths
4. Test all Node.js-based tests that read files with `fs.readFileSync()`

The symlink is a **pragmatic solution** that allows the test suite to work without modifying dozens of files. It creates no runtime overhead and is transparent to the application itself.

## Recommendation

**Keep the symlink** unless there's a specific reason to restructure the test suite. The symlink:
- ✅ Maintains compatibility with the existing test suite
- ✅ Requires no changes to working tests
- ✅ Has no performance impact
- ✅ Is a standard Unix/Linux feature
- ⚠️ Can be confusing to developers unfamiliar with symlinks
- ⚠️ Doesn't work on older Windows systems (though modern Windows 10+ supports symlinks)

## For New Tests

When writing new test files, you have two options:

1. **Follow the existing convention** (recommended for consistency):
   ```javascript
   const appJs = fs.readFileSync('../source/app.js', 'utf8');
   ```

2. **Use direct paths** (simpler, but inconsistent):
   ```javascript
   const appJs = fs.readFileSync('../app.js', 'utf8');
   ```

Both work because of the symlink. Choose based on team preference for consistency vs. simplicity.

## History

- The `source` symlink was added in PR #15 to support the new sample cards feature testing
- It enabled the test suite to work without modifying the existing 39 test files
- The alternative would have been a large refactoring PR touching dozens of test files
