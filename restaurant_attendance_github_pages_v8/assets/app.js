function setText(id, text){ const el=document.getElementById(id); if(el) el.textContent=text; }
function show(id){ const el=document.getElementById(id); if(el) el.classList.remove('hidden'); }
function hide(id){ const el=document.getElementById(id); if(el) el.classList.add('hidden'); }
function msg(id, text, type='ok'){ const el=document.getElementById(id); if(!el) return; el.className='notice '+type; el.textContent=text; el.classList.remove('hidden'); }
function escapeHtml(s){ return String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function randomToken(){ const a=new Uint32Array(4); crypto.getRandomValues(a); return Array.from(a).map(n=>n.toString(36)).join('-'); }
function param(name){ return new URLSearchParams(location.search).get(name); }
function setBrand(){ document.querySelectorAll('[data-brand]').forEach(el=>el.textContent=window.APP_CONFIG.restaurantName); document.querySelectorAll('[data-mode]').forEach(el=>el.textContent=DB.mode()); }
async function boot(){ await DB.init(); await DB.seedDefaults(); setBrand(); }
