// Runs every test/test_*.js script in its own process (from this directory, since
// the tests use relative paths) and exits non-zero if any of them fail or time out.
const { spawnSync } = require('child_process');
const fs = require('fs');

const TIMEOUT_MS = 30000;
const files = fs.readdirSync(__dirname).filter(f => /^test_.*\.js$/.test(f)).sort();
const failed = [];

for (const file of files) {
    const result = spawnSync(process.execPath, [file], { cwd: __dirname, encoding: 'utf8', timeout: TIMEOUT_MS });
    if (result.status === 0) {
        console.log(`PASS ${file}`);
    } else {
        const reason = result.error ? result.error.code : `exit ${result.status}`;
        console.log(`FAIL ${file} (${reason})`);
        console.log((result.stdout + result.stderr).split('\n').map(l => `    ${l}`).join('\n'));
        failed.push(file);
    }
}

console.log(`\n${files.length - failed.length}/${files.length} test scripts passed`);
process.exit(failed.length ? 1 : 0);
