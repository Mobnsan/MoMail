const cp = require('child_process');

try {
  const result = cp.execSync('netstat -ano | findstr LISTENING | findstr 5000', { encoding: 'utf-8' });
  const lines = result.split('\n').filter(l => l.trim());
  console.log('netstat output:', lines);
  
  if (lines.length > 0) {
    // Extract PID from format: TCP    0.0.0.0:5000           0.0.0.0:0              LISTENING       19700
    const parts = lines[0].trim().split(/\s+/);
    const pid = parts[parts.length - 1];  // Last field is the PID
    
    if (pid && pid !== '' && !isNaN(pid)) {
      console.log('Killing PID:', pid);
      cp.execSync(`taskkill /PID ${pid} /F`);
      console.log('Successfully killed PID', pid);
      console.log('Waiting 2 seconds...');
      setTimeout(() => {
        console.log('Starting backend...');
        cp.spawn('node', ['server/server.js'], {
          cwd: 'c:\\Users\\zahra\\Desktop\\react\\projet mona\\momail',
          stdio: 'inherit'
        });
      }, 2000);
    }
  }
} catch (e) {
  console.log('Error:', e.message);
}
