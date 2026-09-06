/* =========================================================
   auth.js — frontend-only demo authentication (LocalStorage)
   ========================================================= */

function currentSession(){ return lsGet(LS_KEYS.SESSION, null); }

function requireAuth(){
  const s = currentSession();
  if (!s){ window.location.href = 'index.html'; }
  return s;
}

function logout(){
  localStorage.removeItem(LS_KEYS.SESSION);
  window.location.href = 'index.html';
}

function handleLogin(e){
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const errorBox = document.getElementById('login-error');
  errorBox.style.display = 'none';

  const users = lsGet(LS_KEYS.USERS, []);
  const user = users.find(u => u.email.toLowerCase() === email && u.password === password);

  if (!user){
    errorBox.textContent = 'Invalid email or password. Try the demo credentials below.';
    errorBox.style.display = 'block';
    return;
  }
  lsSet(LS_KEYS.SESSION, { name: user.name, email: user.email, org: user.org, role: user.role, loginAt: new Date().toISOString() });
  window.location.href = 'dashboard.html';
}

function fillDemoLogin(){
  document.getElementById('login-email').value = 'demo@wlms.gov.in';
  document.getElementById('login-password').value = 'demo1234';
}

function handleRegister(e){
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const org = document.getElementById('reg-org').value.trim() || 'Independent Observer';
  const role = document.getElementById('reg-role').value;
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  const errorBox = document.getElementById('reg-error');
  const successBox = document.getElementById('reg-success');
  errorBox.style.display = 'none';
  successBox.style.display = 'none';

  if (password.length < 6){
    errorBox.textContent = 'Password must be at least 6 characters.';
    errorBox.style.display = 'block';
    return;
  }
  if (password !== confirm){
    errorBox.textContent = 'Passwords do not match.';
    errorBox.style.display = 'block';
    return;
  }
  const users = lsGet(LS_KEYS.USERS, []);
  if (users.some(u => u.email.toLowerCase() === email)){
    errorBox.textContent = 'An account with this email already exists. Please log in instead.';
    errorBox.style.display = 'block';
    return;
  }
  users.push({ name, email, password, org, role });
  lsSet(LS_KEYS.USERS, users);
  successBox.textContent = '✅ Account created successfully. Redirecting to login…';
  successBox.style.display = 'block';
  setTimeout(() => { window.location.href = 'index.html'; }, 1400);
}
