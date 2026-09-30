const fs = require('fs');
const { execSync } = require('child_process');

const base = process.argv[2];
const head = process.argv[3];
const out = process.argv[4];

if (!base || !head || !out) {
    console.error('Usage: node make_review_package.js BASE HEAD OUTFILE');
    process.exit(1);
}

const commits = execSync(`git log --oneline ${base}..${head}`, { encoding: 'utf8' });
const stat = execSync(`git diff --stat ${base}..${head}`, { encoding: 'utf8' });
const diff = execSync(`git diff -U10 ${base}..${head}`, { encoding: 'utf8' });

const content = `# Review package: ${base}..${head}

## Commits
${commits}
## Files changed
${stat}
## Diff
${diff}
`;

fs.writeFileSync(out, content, 'utf8');
console.log('Wrote review package to:', out);
