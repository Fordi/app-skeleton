const { resolve } = require('path');
const { spawn } = require('child_process');
const { watch } = require('chokidar');

const serverEntry = './server';
const appRoot = resolve(__dirname);
const [ node ] = process.argv;
const args = typeof PhusionPassenger !== 'undefined' ? [] : process.argv.slice(2);

const spawnScript = (src, ...args) => {
  let child;
  const run = async () => { 
    console.debug('Starting subprocess');
    child = spawn(node, [src, ...args], { stdio: 'inherit' }); 
    console.debug(`Subprocess started on ${child.pid}`);
  };
  run();
  const test = async () => new Promise((resolve, reject) => {
    const t = spawn(node, [src, ...args, '-t']);
    const stderr = [];
    t.stderr.on('data', (data) => {
      stderr.push(data);
    });
    t.on('close', (code) => {
      if (code != 0) {
        reject(new Error(`Server died with errorcode: ${code}\n${stderr.join('')}`))
      } else {
        resolve();
      }
    });
  });
  const kill = (sig = 2) => {
    if (process.platform.startsWith('win')) {
      console.debug(`Killing ${child.pid} with taskkill`);
      spawn('taskkill', ['/pid', child.pid, '/f', '/t']);
    } else {
      console.debug(`Killing ${child.pid}`);
      child.kill(sig);
    }
  }
  const restart = async (sig, ...args) => {
    try {
      await test();
      if (child.exitCode !== null) return run();
      child.on('close', () => setTimeout(run, 250));
      kill(sig);
    } catch (e) {
      console.log('Restart failed; leaving old server running.', e);
    }
  };
  return { kill, restart };
};

const scheduled = (fn, timeout = 250) => {
  let handle = null;
  return () => {
    if (handle) {
      clearTimeout(handle);
      handle = null;
    }
    handle = setTimeout(() => {
      handle = null;
      fn();
    }, timeout);
  }
};

const watchServer = handler => (
  watch(resolve(appRoot, serverEntry), { recursive: true, encoding: 'utf-8' })
    .on('raw', handler)
);

if (typeof PhusionPassenger !== 'undefined') {
  console.log('Starting app from DreamHost');
  watchServer(scheduled(() => writeFileSync(resolve(appRoot, '../tmp/restart.txt'), '', enc)));
  require(serverEntry);
} else {
  console.log('Starting app as native');
  const { restart } = spawnScript(resolve(appRoot, serverEntry), ...args);
  watchServer(scheduled(() => restart()));
}
