// Shared helper: serve the repo root over http (so the service worker runs), open index.html
// at iPhone size (390×844) with fresh storage, and collect page errors.
// Google Fonts are answered with an empty stylesheet so tests don't depend on the network.
const {chromium} = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.json': 'application/json'};
function serve(overrides = {}) {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
      if (overrides[p] !== undefined) { rsp.writeHead(200, {'content-type': TYPES[path.extname(p)] || 'text/plain', 'cache-control': 'no-store'}); return rsp.end(overrides[p]); }
      const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); return rsp.end('not found'); }
      rsp.writeHead(200, {'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store'}); fs.createReadStream(f).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res({srv, url: `http://127.0.0.1:${srv.address().port}/`, overrides}));
  });
}
async function openApp(opts = {}) {
  const server = await serve();
  const b = await chromium.launch(process.env.CHROMIUM ? {executablePath: process.env.CHROMIUM} : {});
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, acceptDownloads: true, serviceWorkers: opts.sw ? 'allow' : 'block'});
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({status: 200, contentType: 'text/css', body: ''}));
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGE ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('CON ' + m.text()); });
  await p.goto(server.url); await p.waitForTimeout(opts.wait || 600);
  const close = async () => { await b.close(); server.srv.close(); };
  return {b, ctx, p, errs, server, close};
}
module.exports = {openApp, serve, ROOT};
