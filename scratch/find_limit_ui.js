const fs = require('fs');
const content = fs.readFileSync('e:/mantrapuja/free bhajan/src/components/GlobalPlayer.js', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, index) => {
  const lineNum = index + 1;
  if (line.includes('isLimitReached') || line.includes('limit') || line.includes('Popup')) {
    if (lineNum > 665) {
      console.log(`${lineNum}: ${line.trim()}`);
    }
  }
});
