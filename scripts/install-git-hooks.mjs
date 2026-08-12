import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

if (!existsSync('.git')) {
  process.exit(0);
}

await execFileAsync('git', ['config', 'core.hooksPath', '.githooks']);
console.log('Configured Git hooks from .githooks.');
