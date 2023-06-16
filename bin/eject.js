import { mkdir, readFile, rmdir, unlink, writeFile } from 'fs/promises';
import { exec } from 'child_process';

if (process.argv.length === 2) {
  console.log('Install dependencies from NPM as standalone files suitable for import from a browser.');
  console.log(`Usage: npm run eject [...deps]`);
  process.exit();
}

// This function will output the lines from the script 
// AS is runs, AND will return the full combined output
// as well as exit code when it's done (using the callback).
const sh = async (command, args) => new Promise((resolve, reject) => {
  const child = exec(command, args);
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (data) => console.log(data));
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (data) => console.warn(data));
  child.on('close', function(code) {
    if (code === 0) resolve();
    else reject(new Error(`${command} exited with ${code}`));
  });
});
const packageJson = await readFile('./package.json', 'utf8');
let packageLock = null;
try {
  packageLock = await readFile('./package-lock.json', 'utf8');
} catch (e) { /* swallow it */ }

const resources = process.argv.slice(2);
const deps = [...resources.reduce((s, item) => {
  const [_, scope, pkg, path, version] = item.match(/^(?:(@[a-zA-Z\-0-9_]+)\/)?([a-zA-Z\-0-9_]+)(?:\/(.*))?(?:(@[^~]?[0-9\.]+))?$/) || [];
  const packageName = [scope, pkg].filter(a => !!a).join('/');
  if (packageName) {
    s.add(packageName + (version || ''));
  }
  return s;
}, new Set())];


const slug = (fn) => fn.replace(/^@/, '_').replace(/\//g, '--');

console.log(`Installing dev dependencies: ${deps.join(', ')}`);
const html = await readFile('./src/index.html', 'utf8');
const importMapOpen = html.indexOf('<script type="importmap"');
const importMapStart = html.substring(importMapOpen).indexOf('>') + importMapOpen + 1;
const importMapEnd = html.substring(importMapStart).indexOf('</script>') + importMapStart;
const indent = html.substring(importMapStart, importMapEnd).replace(/^\n+/, '').match(/^[\s\t]+/)[0];
const trails = html.substring(importMapStart, importMapEnd).match(/\}[\r\n]*([\s\t]*)$/)[1];

const importMap = JSON.parse(html.substring(importMapStart, importMapEnd));

await sh(`npm i -D ${deps.join(' ')}`);
await mkdir('./tmp', { recursive: true });
await mkdir('./src/vendor', { recursive: true });

await Promise.all(resources.map(async (resource) => {
  const res = resource.replace(/@[^~]?[\d\.]+$/, '');
  const wrapperFile = `./tmp/${slug(res)}.js`;
  const vendorFile = `vendor/${slug(res)}.js`
  await writeFile(wrapperFile, `import * as PACKAGE from "${res}"; export default PACKAGE;`, 'utf-8');
  await sh(`npx rollup --format=es --input "${wrapperFile}" -c configs/rollup.config.mjs -o "./src/${vendorFile}"`);
  await unlink(wrapperFile);
  importMap.imports[res] = `./${vendorFile}`;
}));

const newHtml = [
  html.substring(0, importMapStart),
  ...JSON.stringify(importMap, null, 2).split("\n").map(a => `${indent}${a}`),
  trails + html.substring(importMapEnd)
].join('\n');
console.log('Updating src/index.html');
await writeFile('./src/index.html', newHtml, 'utf8');

//cleanup
await rmdir('./tmp', { recursive: true });
await writeFile('./package.json', packageJson, 'utf8');
if (packageLock !== null) {
  await writeFile('./package-lock.json', packageLock, 'utf8');
} else {
  await unlink('./package-lock.json');
}