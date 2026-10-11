// Shared helper: open the built index.html at iPhone size with fresh storage and collect page errors.
const {chromium} = require('playwright');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
async function openApp(opts = {}) {
  const b = await chromium.launch(process.env.CHROMIUM ? {executablePath: process.env.CHROMIUM} : {});
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, acceptDownloads: true});
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGE ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text()) && !/ERR_(NAME|INTERNET|PROXY|TUNNEL|CONNECTION)/.test(m.text())) errs.push('CON ' + m.text()); });
  if (opts.block !== false) await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({status: 200, contentType: 'text/css', body: ''}));
  await p.goto(URL); await p.waitForTimeout(opts.wait || 600);
  return {b, ctx, p, errs};
}
module.exports = {openApp, URL};
