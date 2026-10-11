/* ===== VERSION 2.0: Home Screen app (service worker + update toast) ===== */
function registerSW() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading) return; reloading = true; location.reload(); });
  navigator.serviceWorker.register('sw.js').then(reg => {
    const offer = w => { if (w && navigator.serviceWorker.controller) updateToast(w); };
    if (reg.waiting) offer(reg.waiting);
    reg.addEventListener('updatefound', () => { const w = reg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'installed') offer(w); }); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(() => {});
}
function updateToast(worker) {
  if ($('#update')) return;
  const el = document.createElement('div'); el.id = 'update'; el.setAttribute('role', 'status');
  el.innerHTML = `<span>Nieuwe versie</span><button class="link" type="button" data-en="New version: reload">Herlaad</button>`;
  el.querySelector('button').onclick = () => { Store.flush(); worker.postMessage('skipWaiting'); };
  document.body.appendChild(el);
}
