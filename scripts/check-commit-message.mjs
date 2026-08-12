import { readFile } from 'node:fs/promises';

const allowedTypes = ['feat', 'fix', 'style', 'perf', 'refactor', 'docs', 'chore'];
const subjectPattern = new RegExp(`^(?:${allowedTypes.join('|')}):\\s+\\S`);

function assertValidSubject(subject, source) {
  if (subjectPattern.test(subject)) return;

  console.error(`Invalid commit subject in ${source}: ${subject || '<empty>'}`);
  console.error(`Use: <type>: <description>`);
  console.error(`Allowed types: ${allowedTypes.join(', ')}`);
  process.exitCode = 1;
}

async function readSubjectsFromRange(range) {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileAsync = promisify(execFile);
  const { stdout } = await execFileAsync('git', ['log', '--format=%s', range]);
  return stdout.split('\n').filter(Boolean);
}

const [input, value] = process.argv.slice(2);

if (input === '--subject') {
  assertValidSubject(value ?? '', '--subject');
} else if (!input) {
  console.error('Usage: node scripts/check-commit-message.mjs <message-file | git-range>');
  console.error('   or: node scripts/check-commit-message.mjs --subject <subject>');
  process.exitCode = 1;
} else if (input.includes('..')) {
  const subjects = await readSubjectsFromRange(input);
  subjects.forEach((subject) => assertValidSubject(subject, input));
} else {
  const message = await readFile(input, 'utf8');
  const subject = message.split('\n').find((line) => !line.startsWith('#'))?.trim() ?? '';
  assertValidSubject(subject, input);
}
