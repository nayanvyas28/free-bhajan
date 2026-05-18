const fs = require('fs');
const content = fs.readFileSync('e:/mantrapuja/free bhajan/src/components/GlobalPlayer.js', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, index) => {
  const lineNum = index + 1;
  if (line.includes('player.') || line.includes('useVideoPlayer')) {
    console.log(`${lineNum}: ${line.trim()}`);
  }
});
