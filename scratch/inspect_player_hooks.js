const fs = require('fs');
const content = fs.readFileSync('e:/mantrapuja/free bhajan/src/components/GlobalPlayer.js', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, index) => {
  const lineNum = index + 1;
  if (lineNum > 665) {
    if (line.match(/\buse[A-Z]/) || line.includes('useEffect') || line.includes('useState') || line.includes('useRef')) {
      console.log(`${lineNum}: ${line.trim()}`);
    }
  }
});
