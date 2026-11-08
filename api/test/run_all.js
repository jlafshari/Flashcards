// Runs every test/test_*.js script in its own process and exits non-zero if any fail.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const TIMEOUT_MS = 30000;
const files = fs.readdirSync(dir).filter(f => /^test_.*\.js$/.test(f)).sort();
const failed = [];

for (const file of files) {
    const result = spawnSync(process.execPath, [file], { cwd: dir, encoding: 'utf8', timeout: TIMEOUT_MS });
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
