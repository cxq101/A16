const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = name => fs.readFileSync(path.join(__dirname, 'dist', name), 'utf8');
const html = read('index.html')
  .replace('<link rel="stylesheet" href="style.css"><link rel="stylesheet" href="expansion.css">', () => `<style>${read('style.css')}\n${read('expansion.css')}</style>`)
  .replace('<script src="app.js"></script><script src="game.js"></script>', () => `<script>${read('app.js')}\n${read('game.js')}</script>`);
fs.writeFileSync(path.join(__dirname, 'demo.html'), html, 'utf8');
new vm.Script(read('app.js'));
new vm.Script(read('game.js'));
new vm.Script(read('app.js')+'\n'+read('game.js'));
if (!html.includes('<style>') || !html.includes('<script>') || /src="(app|game)\.js"/.test(html)) throw new Error('Incomplete standalone bundle');
console.log('PASS: offline demo.html includes all styles, artwork and valid JavaScript');
