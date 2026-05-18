const fs = require('fs');
const code = fs.readFileSync('e:/mantrapuja/free bhajan/src/components/ScreenWrapper.js', 'utf8');
const lines = code.split(/\r?\n/);
lines.forEach((line, index) => {
  const lineNum = index + 1;
  if (line.includes('return') && !line.includes('return;') && !line.trim().startsWith('//')) {
    console.log(`${lineNum}: ${line.trim()}`);
  }
});
