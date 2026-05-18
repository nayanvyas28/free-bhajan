const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.git' && f !== '.expo' && f !== '.expo_local' && f !== 'admin-web') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

console.log("Analyzing hooks vs early returns...");
walkDir('e:/mantrapuja/free bhajan/src', (filePath) => {
  if (!filePath.endsWith('.js')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  
  let lastHookLineNum = 0;
  let earlyReturnLines = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    // Check for hooks
    if (line.includes('useState') || line.includes('useEffect') || line.includes('useRef') || line.includes('usePlayer') || line.includes('useTheme') || line.includes('useAuth') || line.includes('useLanguage') || line.includes('useCustomAlert')) {
      if (!line.includes('import')) {
        lastHookLineNum = lineNum;
      }
    }
    
    // Check for early returns
    if (line.includes('return ') && !line.includes('return;') && !line.trim().startsWith('//')) {
      // Check if it's returning from a standard hook callback or regular helper
      if (line.includes('=>') || line.includes('function') || line.includes('FlatList') || line.includes('render')) {
        // Safe callback/helper
      } else {
        earlyReturnLines.push({ lineNum, content: line.trim() });
      }
    }
  });

  // If there are early returns BEFORE the last hook
  const violations = earlyReturnLines.filter(r => r.lineNum < lastHookLineNum);
  if (violations.length > 0) {
    console.log(`\nVIOLATION in ${filePath} (Last hook on line ${lastHookLineNum}):`);
    violations.forEach(v => {
      console.log(`  Line ${v.lineNum}: ${v.content}`);
    });
  }
});
