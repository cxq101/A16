const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'dist');
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const standalone = name === 'desk3d-standalone.html';
  const file = standalone ? path.join(__dirname,'desk3d.html') : path.resolve(root, name);
  if (!standalone && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, {'Content-Type': {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'}[path.extname(file)] || 'application/octet-stream'});
    res.end(data);
  });
}).listen(5173, '127.0.0.1', () => process.stdout.write('Local: http://127.0.0.1:5173\n'));
