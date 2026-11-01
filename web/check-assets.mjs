import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('web');
function exists(file) { return fs.existsSync(path.join(root, file)); }
for (const f of ['index.html','core.js','defaults.js','sw.js','shopping.html','family-checklist.html','shopping-batches.js','saree-sections.js']) {
  if (!exists(f)) throw Error('Missing web asset: '+f);
}
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const match=sw.match(/const CORE=(\[[^;]+);/);
if(!match) throw Error('Service worker does not list cached assets');
for(const src of JSON.parse(match[1].replace(/'/g,'"'))) {
  const file=src==='/'?'index.html':src.replace(/^\//,'');
  if(!exists(file)) throw Error('Missing cached asset: '+src);
}
const htmls=fs.readdirSync(root).filter(f=>f.endsWith('.html'));
for(const file of htmls){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  for(const m of html.matchAll(/(?:src|href)="\/(?!\/)([^"?#]+)(?:[?#][^"]*)?"/g)){
    if(!exists(m[1])) throw Error(file+' links to absent '+m[1]);
  }
}
const core=fs.readFileSync(path.join(root,'core.js'),'utf8');
if(/phone\s*:\s*['"][6-9]\d{9}['"]/.test(core)) throw Error('Personal phone number committed in seeds');
JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
console.log('Web integrity checks passed: '+htmls.length+' pages');
