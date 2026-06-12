(function(){
  const cfg = () => window.firebaseConfig || {};
  const usingFirebase = () => cfg().apiKey && !String(cfg().apiKey).startsWith('PASTE_');
  const key = 'restaurant_attendance_v8_github_local';
  let db = null;

  function uidFromEmail(email){ return String(email||'').trim().toLowerCase().replace(/[.#$\[\]\/]/g,'_'); }
  function today(){ return new Date().toISOString().slice(0,10); }
  function nowIso(){ return new Date().toISOString(); }
  function toTime(iso){ if(!iso) return ''; try { return new Date(iso).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); } catch(e){ return iso; } }
  function formatDate(d){ try{return new Date(d+'T00:00:00').toLocaleDateString([], {year:'numeric', month:'short', day:'numeric'});}catch(e){return d;} }
  function totalHours(inIso,outIso){ if(!inIso || !outIso) return ''; const ms = new Date(outIso)-new Date(inIso); if(ms<=0) return ''; return (ms/3600000).toFixed(2); }
  function loadLocal(){
    const raw = localStorage.getItem(key);
    if(raw) return JSON.parse(raw);
    return { users:{}, attendance:{}, settings:{ currentQr:null }, seeded:false };
  }
  function saveLocal(state){ localStorage.setItem(key, JSON.stringify(state)); }

  async function init(){
    if(usingFirebase()){
      firebase.initializeApp(cfg());
      db = firebase.firestore();
      return 'firebase';
    }
    return 'local';
  }

  async function seedDefaults(){
    const app = window.APP_CONFIG;
    if(usingFirebase()){
      const snap = await db.collection('users').limit(1).get();
      if(!snap.empty) return;
      const admin = app.demoAdmin, emp = app.demoEmployee;
      await db.collection('users').doc(uidFromEmail(admin.email)).set({id:uidFromEmail(admin.email), name:admin.name, email:admin.email.toLowerCase(), password:admin.password, role:'admin', active:true, createdAt:nowIso()});
      await db.collection('users').doc(uidFromEmail(emp.email)).set({id:uidFromEmail(emp.email), name:emp.name, email:emp.email.toLowerCase(), password:emp.password, role:'employee', active:true, createdAt:nowIso()});
      await db.collection('settings').doc('app').set({kioskCode:app.kioskCode, restaurantName:app.restaurantName});
    } else {
      const st = loadLocal();
      if(st.seeded) return;
      const admin = app.demoAdmin, emp = app.demoEmployee;
      st.users[uidFromEmail(admin.email)] = {id:uidFromEmail(admin.email), name:admin.name, email:admin.email.toLowerCase(), password:admin.password, role:'admin', active:true, createdAt:nowIso()};
      st.users[uidFromEmail(emp.email)] = {id:uidFromEmail(emp.email), name:emp.name, email:emp.email.toLowerCase(), password:emp.password, role:'employee', active:true, createdAt:nowIso()};
      st.settings.app = {kioskCode:app.kioskCode, restaurantName:app.restaurantName};
      st.seeded = true;
      saveLocal(st);
    }
  }

  async function login(email,password){
    email = String(email||'').trim().toLowerCase();
    if(usingFirebase()){
      const snap = await db.collection('users').where('email','==',email).limit(1).get();
      if(snap.empty) throw new Error('Account not found.');
      const user = snap.docs[0].data();
      if(!user.active) throw new Error('Account disabled.');
      if(String(user.password)!==String(password)) throw new Error('Wrong password.');
      localStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    }
    const st = loadLocal();
    const user = Object.values(st.users).find(u=>u.email===email);
    if(!user) throw new Error('Account not found.');
    if(!user.active) throw new Error('Account disabled.');
    if(String(user.password)!==String(password)) throw new Error('Wrong password.');
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  }
  function currentUser(){ try{return JSON.parse(localStorage.getItem('currentUser')||'null');}catch(e){return null;} }
  function logout(){ localStorage.removeItem('currentUser'); location.href='login.html'; }
  function requireRole(role){ const u=currentUser(); if(!u || (role && u.role!==role)){ location.href='login.html'; return null; } return u; }

  async function getUsers(){
    if(usingFirebase()){
      const snap = await db.collection('users').orderBy('name').get();
      return snap.docs.map(d=>d.data());
    }
    return Object.values(loadLocal().users).sort((a,b)=>a.name.localeCompare(b.name));
  }
  async function saveUser(user){
    user.email = String(user.email||'').trim().toLowerCase();
    user.id = user.id || uidFromEmail(user.email);
    user.active = user.active !== false;
    user.createdAt = user.createdAt || nowIso();
    if(usingFirebase()) return db.collection('users').doc(user.id).set(user, {merge:true});
    const st = loadLocal(); st.users[user.id]=user; saveLocal(st);
  }


  async function setUserActive(userId, active){
    if(!userId) throw new Error('Missing employee ID.');
    if(usingFirebase()){
      const ref = db.collection('users').doc(userId);
      const doc = await ref.get();
      if(!doc.exists) throw new Error('Employee not found.');
      const user = doc.data();
      if(user.role === 'admin') throw new Error('Admin account cannot be deactivated here.');
      await ref.set({active: !!active, updatedAt: nowIso()}, {merge:true});
      return true;
    }
    const st = loadLocal();
    const user = st.users[userId];
    if(!user) throw new Error('Employee not found.');
    if(user.role === 'admin') throw new Error('Admin account cannot be deactivated here.');
    user.active = !!active;
    user.updatedAt = nowIso();
    st.users[userId] = user;
    saveLocal(st);
    return true;
  }

  async function deleteUser(userId){
    if(!userId) throw new Error('Missing employee ID.');
    if(usingFirebase()){
      const ref = db.collection('users').doc(userId);
      const doc = await ref.get();
      if(!doc.exists) throw new Error('Employee not found.');
      const user = doc.data();
      if(user.role === 'admin') throw new Error('Admin account cannot be deleted here.');
      await ref.delete();
      return true;
    }
    const st = loadLocal();
    const user = st.users[userId];
    if(!user) throw new Error('Employee not found.');
    if(user.role === 'admin') throw new Error('Admin account cannot be deleted here.');
    delete st.users[userId];
    saveLocal(st);
    return true;
  }

  async function setCurrentQr(token,expiresAt){
    const data = {token, expiresAt, createdAt:nowIso()};
    if(usingFirebase()) return db.collection('settings').doc('currentQr').set(data);
    const st = loadLocal(); st.settings.currentQr=data; saveLocal(st);
  }
  async function getCurrentQr(){
    if(usingFirebase()){
      const doc = await db.collection('settings').doc('currentQr').get();
      return doc.exists ? doc.data() : null;
    }
    return loadLocal().settings.currentQr || null;
  }

  async function recordAttendance(user, action, token){
    const qr = await getCurrentQr();
    if(!qr || qr.token !== token) throw new Error('Invalid QR. Scan the latest QR on the restaurant laptop.');
    if(Date.now() > Number(qr.expiresAt)) throw new Error('Expired QR. Scan the new QR code.');
    const date = today();
    const id = date + '_' + user.id;
    let rec = null;
    if(usingFirebase()){
      const ref = db.collection('attendance').doc(id);
      const doc = await ref.get();
      rec = doc.exists ? doc.data() : {id, employeeId:user.id, employeeName:user.name, employeeEmail:user.email, date};
      if(action === 'time_in'){
        if(rec.timeIn) throw new Error('You already timed in today.');
        rec.timeIn = nowIso();
      } else {
        if(!rec.timeIn) throw new Error('You need to Time In first.');
        if(rec.timeOut) throw new Error('You already timed out today.');
        rec.timeOut = nowIso();
      }
      rec.updatedAt = nowIso();
      await ref.set(rec, {merge:true});
      return rec;
    }
    const st = loadLocal();
    rec = st.attendance[id] || {id, employeeId:user.id, employeeName:user.name, employeeEmail:user.email, date};
    if(action === 'time_in'){
      if(rec.timeIn) throw new Error('You already timed in today.');
      rec.timeIn = nowIso();
    } else {
      if(!rec.timeIn) throw new Error('You need to Time In first.');
      if(rec.timeOut) throw new Error('You already timed out today.');
      rec.timeOut = nowIso();
    }
    rec.updatedAt = nowIso();
    st.attendance[id]=rec; saveLocal(st); return rec;
  }

  async function getAttendance(date){
    date = date || today();
    if(usingFirebase()){
      const snap = await db.collection('attendance').where('date','==',date).get();
      return snap.docs.map(d=>d.data()).sort((a,b)=>(a.employeeName||'').localeCompare(b.employeeName||''));
    }
    return Object.values(loadLocal().attendance).filter(r=>r.date===date).sort((a,b)=>(a.employeeName||'').localeCompare(b.employeeName||''));
  }
  async function getEmployeeToday(user){
    const list = await getAttendance(today());
    return list.find(r=>r.employeeId===user.id) || null;
  }

  function mode(){ return usingFirebase() ? 'Firebase Online Mode' : 'Local Demo Mode'; }
  window.DB = {init, seedDefaults, login, logout, currentUser, requireRole, getUsers, saveUser, setUserActive, deleteUser, setCurrentQr, getCurrentQr, recordAttendance, getAttendance, getEmployeeToday, today, toTime, totalHours, formatDate, mode, uidFromEmail};
})();
