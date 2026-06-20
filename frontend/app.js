const browserOrigin = window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file')
  ? window.location.origin
  : 'http://localhost:5000';
const API = localStorage.getItem('hospital2050_api') || browserOrigin;

const state = {
  token: localStorage.getItem('hospital2050_token'),
  user: JSON.parse(localStorage.getItem('hospital2050_user') || 'null'),
  socket: null,
  page: 'overview',
  selectedAppointment: null,
  voiceTranscript: '',
  conversationRecognition: null,
  conversation: null,
  theme: localStorage.getItem('hospital2050_theme') || 'dark'
};
let authStartMode = 'login';

const labels = {
  English: { overview: 'Overview', appointments: 'Appointments', history: 'Appointment History', ai: 'AI Center', records: 'Records', monitoring: 'Monitoring', beds: 'Beds', chat: 'Chat', admin: 'Analytics' },
  Hindi: { overview: 'सारांश', appointments: 'अपॉइंटमेंट', history: 'इतिहास', ai: 'AI केंद्र', records: 'रिकॉर्ड', monitoring: 'निगरानी', beds: 'बेड', chat: 'चैट', admin: 'विश्लेषण' },
  Marathi: { overview: 'आढावा', appointments: 'भेटी', history: 'इतिहास', ai: 'AI केंद्र', records: 'नोंदी', monitoring: 'निगराणी', beds: 'बेड', chat: 'चॅट', admin: 'विश्लेषण' },
  Gujarati: { overview: 'સારાંશ', appointments: 'મુલાકાતો', history: 'ઇતિહાસ', ai: 'AI કેન્દ્ર', records: 'રેકોર્ડ', monitoring: 'મોનિટરિંગ', beds: 'બેડ', chat: 'ચેટ', admin: 'વિશ્લેષણ' },
  Tamil: { overview: 'கண்ணோட்டம்', appointments: 'சந்திப்புகள்', history: 'வரலாறு', ai: 'AI மையம்', records: 'பதிவுகள்', monitoring: 'கண்காணிப்பு', beds: 'படுக்கைகள்', chat: 'அரட்டை', admin: 'பகுப்பாய்வு' },
  Telugu: { overview: 'అవలోకనం', appointments: 'అపాయింట్మెంట్లు', history: 'చరిత్ర', ai: 'AI కేంద్రం', records: 'రికార్డులు', monitoring: 'పర్యవేక్షణ', beds: 'పడకలు', chat: 'చాట్', admin: 'విశ్లేషణ' },
  Kannada: { overview: 'ಅವಲೋಕನ', appointments: 'ನೇಮಕಾತಿಗಳು', history: 'ಇತಿಹಾಸ', ai: 'AI ಕೇಂದ್ರ', records: 'ದಾಖಲೆಗಳು', monitoring: 'ಮೇಲ್ವಿಚಾರಣೆ', beds: 'ಹಾಸಿಗೆಗಳು', chat: 'ಚಾಟ್', admin: 'ವಿಶ್ಲೇಷಣೆ' },
  Bengali: { overview: 'ওভারভিউ', appointments: 'অ্যাপয়েন্টমেন্ট', history: 'ইতিহাস', ai: 'AI কেন্দ্র', records: 'রেকর্ড', monitoring: 'পর্যবেক্ষণ', beds: 'বেড', chat: 'চ্যাট', admin: 'বিশ্লেষণ' }
};
const departmentOptions = ['Cardiology', 'Neurology', 'Orthopedics', 'Dermatology', 'Pediatrics', 'Gynecology', 'General Medicine', 'Emergency'];
for (const language of Object.keys(labels)) {
  labels[language] = { overview: 'Overview', appointments: 'Appointments', history: 'History', ai: 'AI Center', records: 'Records', monitoring: 'Monitoring', beds: 'Beds', chat: 'Chat', admin: 'Analytics' };
}
Object.assign(labels, {
  Hindi: { overview: '\u0938\u093e\u0930\u093e\u0902\u0936', appointments: '\u0905\u092a\u0949\u0907\u0902\u091f\u092e\u0947\u0902\u091f', history: '\u0907\u0924\u093f\u0939\u093e\u0938', ai: '\u0938\u094d\u092e\u093e\u0930\u094d\u091f \u0938\u0939\u093e\u092f\u0924\u093e', records: '\u0930\u093f\u0915\u0949\u0930\u094d\u0921', monitoring: '\u0928\u093f\u0917\u0930\u093e\u0928\u0940', beds: '\u092c\u0947\u0921', chat: '\u091a\u0948\u091f', admin: '\u0935\u093f\u0936\u094d\u0932\u0947\u0937\u0923' },
  Marathi: { overview: '\u0906\u0922\u093e\u0935\u093e', appointments: '\u092d\u0947\u091f\u0940', history: '\u0907\u0924\u093f\u0939\u093e\u0938', ai: '\u0938\u094d\u092e\u093e\u0930\u094d\u091f \u092e\u0926\u0924', records: '\u0928\u094b\u0902\u0926\u0940', monitoring: '\u0928\u093f\u0917\u0930\u093e\u0923\u0940', beds: '\u092c\u0947\u0921', chat: '\u091a\u0945\u091f', admin: '\u0935\u093f\u0936\u094d\u0932\u0947\u0937\u0923' },
  Gujarati: { overview: '\u0ab8\u0abe\u0ab0\u0abe\u0a82\u0ab6', appointments: '\u0a8f\u0aaa\u0acb\u0a87\u0aa8\u0acd\u0a9f\u0aae\u0ac7\u0aa8\u0acd\u0a9f', history: '\u0a87\u0aa4\u0abf\u0ab9\u0abe\u0ab8', ai: '\u0ab8\u0acd\u0aae\u0abe\u0ab0\u0acd\u0a9f \u0aae\u0aa6\u0aa6', records: '\u0ab0\u0ac7\u0a95\u0acb\u0ab0\u0acd\u0aa1', monitoring: '\u0aae\u0acb\u0aa8\u0abf\u0a9f\u0ab0\u0abf\u0a82\u0a97', beds: '\u0aac\u0ac7\u0aa1', chat: '\u0a9a\u0ac7\u0a9f', admin: '\u0ab5\u0abf\u0ab6\u0acd\u0ab2\u0ac7\u0ab7\u0aa3' },
  Tamil: { overview: '\u0b95\u0ba3\u0bcd\u0ba3\u0bcb\u0b9f\u0bcd\u0b9f\u0bae\u0bcd', appointments: '\u0b9a\u0ba8\u0bcd\u0ba4\u0bbf\u0baa\u0bcd\u0baa\u0bc1', history: '\u0bb5\u0bb0\u0bb2\u0bbe\u0bb1\u0bc1', ai: '\u0bb8\u0bcd\u0bae\u0bbe\u0bb0\u0bcd\u0b9f\u0bcd \u0b89\u0ba4\u0bb5\u0bbf', records: '\u0baa\u0ba4\u0bbf\u0bb5\u0bc1\u0b95\u0bb3\u0bcd', monitoring: '\u0b95\u0ba3\u0bcd\u0b95\u0bbe\u0ba3\u0bbf\u0baa\u0bcd\u0baa\u0bc1', beds: '\u0baa\u0b9f\u0bc1\u0b95\u0bcd\u0b95\u0bc8', chat: '\u0b85\u0bb0\u0b9f\u0bcd\u0b9f\u0bc8', admin: '\u0baa\u0b95\u0bc1\u0baa\u0bcd\u0baa\u0bbe\u0baf\u0bcd\u0bb5\u0bc1' },
  Telugu: { overview: '\u0c05\u0c35\u0c32\u0c4b\u0c15\u0c28\u0c02', appointments: '\u0c05\u0c2a\u0c3e\u0c2f\u0c3f\u0c02\u0c1f\u0c4d\u0c2e\u0c46\u0c02\u0c1f\u0c4d', history: '\u0c1a\u0c30\u0c3f\u0c24\u0c4d\u0c30', ai: '\u0c38\u0c4d\u0c2e\u0c3e\u0c30\u0c4d\u0c1f\u0c4d \u0c38\u0c39\u0c3e\u0c2f\u0c02', records: '\u0c30\u0c3f\u0c15\u0c3e\u0c30\u0c4d\u0c21\u0c4d\u0c32\u0c41', monitoring: '\u0c2a\u0c30\u0c4d\u0c2f\u0c35\u0c47\u0c15\u0c4d\u0c37\u0c23', beds: '\u0c2c\u0c46\u0c21\u0c4d\u0c32\u0c41', chat: '\u0c1a\u0c3e\u0c1f\u0c4d', admin: '\u0c35\u0c3f\u0c36\u0c4d\u0c32\u0c47\u0c37\u0c23' },
  Kannada: { overview: '\u0c85\u0cb5\u0cb2\u0ccb\u0c95\u0ca8', appointments: '\u0ca8\u0cc7\u0cae\u0c95\u0cbe\u0ca4\u0cbf', history: '\u0c87\u0ca4\u0cbf\u0cb9\u0cbe\u0cb8', ai: '\u0cb8\u0ccd\u0cae\u0cbe\u0cb0\u0ccd\u0c9f\u0ccd \u0cb8\u0cb9\u0cbe\u0caf', records: '\u0ca6\u0cbe\u0c96\u0cb2\u0cc6\u0c97\u0cb3\u0cc1', monitoring: '\u0cae\u0cc7\u0cb2\u0ccd\u0cb5\u0cbf\u0c9a\u0cbe\u0cb0\u0ca3\u0cc6', beds: '\u0cb9\u0cbe\u0cb8\u0cbf\u0c97\u0cc6', chat: '\u0c9a\u0cbe\u0c9f\u0ccd', admin: '\u0cb5\u0cbf\u0cb6\u0ccd\u0cb2\u0cc7\u0cb7\u0ca3\u0cc6' },
  Bengali: { overview: '\u0993\u09ad\u09be\u09b0\u09ad\u09bf\u0989', appointments: '\u0985\u09cd\u09af\u09be\u09aa\u09af\u09bc\u09c7\u09a8\u09cd\u099f\u09ae\u09c7\u09a8\u09cd\u099f', history: '\u0987\u09a4\u09bf\u09b9\u09be\u09b8', ai: '\u09b8\u09cd\u09ae\u09be\u09b0\u09cd\u099f \u09b8\u09b9\u09be\u09af\u09bc\u09a4\u09be', records: '\u09b0\u09c7\u0995\u09b0\u09cd\u09a1', monitoring: '\u09aa\u09b0\u09cd\u09af\u09ac\u09c7\u0995\u09cd\u09b7\u09a3', beds: '\u09ac\u09c7\u09a1', chat: '\u099a\u09cd\u09af\u09be\u099f', admin: '\u09ac\u09bf\u09b6\u09cd\u09b2\u09c7\u09b7\u09a3' }
});

function t(key) { return (labels[state.user?.language || 'English'] || labels.English)[key] || key; }
function esc(value = '') { return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function departmentSelect(required = false) { return `<label>Department<select name="department" class="input" ${required ? 'required' : ''}><option value="">Select department</option>${departmentOptions.map((name) => `<option>${name}</option>`).join('')}</select></label>`; }

function renderRoleFields(role) {
  const roleFields = document.getElementById('role-fields');
  if (!roleFields) return;
  if (role === 'doctor') {
    roleFields.innerHTML = `${departmentSelect(true)}<label>Specialization<input name="specialization" class="input" required /></label><label>Medical license number<input name="licenseNumber" class="input" /></label><label>Experience years<input name="experienceYears" type="number" min="0" class="input" /></label><label>Qualification<input name="qualification" class="input" /></label><label>Consultation room<input name="consultationRoom" class="input" /></label><label>Phone<input name="phone" class="input" /></label>`;
    return;
  }
  if (role === 'nurse') {
    roleFields.innerHTML = `${departmentSelect(true)}<label>Ward / unit<input name="ward" class="input" /></label><label>Shift<select name="shift" class="input"><option>Morning</option><option>Evening</option><option>Night</option><option>Rotational</option></select></label><label>Qualification<input name="qualification" class="input" /></label><label>Experience years<input name="experienceYears" type="number" min="0" class="input" /></label><label>Phone<input name="phone" class="input" /></label>`;
    return;
  }
  roleFields.innerHTML = `<label>Occupation<input name="occupation" class="input" /></label><label>Age<input name="age" type="number" min="0" class="input" /></label><label>Gender<select name="gender" class="input"><option value="">Select gender</option><option>Female</option><option>Male</option><option>Other</option><option>Prefer not to say</option></select></label><label>Blood group<input name="bloodGroup" class="input" /></label><label>Allergies<input name="allergies" class="input" /></label><label>Emergency contact<input name="emergencyContact" class="input" /></label><label>Phone<input name="phone" class="input" /></label><label>Address<input name="address" class="input" /></label>`;
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  try {
    const res = await fetch(`${API}${path}`, { ...options, headers });
    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) throw new Error(data.message || data || 'Request failed');
    return data;
  } catch (error) {
    if (error instanceof TypeError) throw new Error(`Failed to reach backend at ${API}. Start backend and open http://localhost:5000.`);
    throw error;
  }
}

function speak(text) {
  if (!('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = ({ Hindi: 'hi-IN', Marathi: 'mr-IN', Gujarati: 'gu-IN', Tamil: 'ta-IN', Telugu: 'te-IN', Kannada: 'kn-IN', Bengali: 'bn-IN' }[state.user?.language] || 'en-US');
  speechSynthesis.speak(utterance);
}
window.speak = speak;

function browserNotify(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') new Notification(title, { body });
  else Notification.requestPermission();
}

function toast(title, message, severity = 'Info') {
  const node = document.createElement('div');
  node.className = `fixed right-4 top-4 z-50 max-w-sm glass p-4 ${severity === 'Critical' ? 'pulse-alert' : ''}`;
  node.innerHTML = `<strong>${esc(title)}</strong><p class="mt-1 text-sm text-slate-300">${esc(message)}</p>`;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 5500);
}

function setLoading(node, text) {
  node.innerHTML = `<span class="loading">${esc(text)}</span>`;
}

function applyTheme() {
  document.body.classList.toggle('light-theme', state.theme === 'light');
}

function homeScreen() {
  applyTheme();
  const app = document.getElementById('app');
  app.innerHTML = document.getElementById('home-template').innerHTML;
  document.getElementById('home-login').onclick = () => {
    authStartMode = 'login';
    authScreen();
  };
  document.getElementById('home-signup').onclick = () => {
    authStartMode = 'signup';
    authScreen();
  };
}

function connectSocket() {
  if (!state.token || state.socket || !window.io) return;
  state.socket = io(API);
  state.socket.emit('register', { userId: state.user._id, role: state.user.role });
  if (state.user.department?._id) state.socket.emit('join:department', state.user.department._id);
  state.socket.on('notification:new', (n) => { toast(n.title, n.message, n.severity); if (n.severity === 'High' || n.severity === 'Critical') speak(n.message); });
  state.socket.on('queue:fiveAhead', (p) => { toast('Queue alert', p.message, 'High'); browserNotify('LifeCare Hospital', p.message); speak(p.message); });
  state.socket.on('medicine:lowStock', (p) => { toast(p.title, p.message, 'High'); speak(p.message); });
  state.socket.on('bed:low', (p) => { const msg = `Low bed alert. Only ${p.available} ${p.type} beds remain.`; toast('Low bed availability', msg, 'High'); speak(msg); });
  state.socket.on('admission:new', (p) => { const msg = `${p.patient?.name || 'Patient'} admitted to ${p.ward || p.type}, bed ${p.code}.`; toast('New admission', msg, 'High'); speak(msg); });
  state.socket.on('followup:new', (p) => { const msg = `Follow up scheduled for ${p.followUpDate}.`; toast('Follow-up', msg, 'Info'); speak(msg); });
  state.socket.on('emergency:alert', (p) => { document.body.classList.add('pulse-alert'); toast('Emergency', p.message, 'Critical'); speak(p.voice || p.message); setTimeout(() => document.body.classList.remove('pulse-alert'), 9000); });
  ['appointment:new', 'appointment:rescheduled', 'bed:update', 'message:new', 'vital:new', 'followup:new'].forEach((eventName) => state.socket.on(eventName, () => render()));
}

function authScreen() {
  const app = document.getElementById('app');
  app.innerHTML = document.getElementById('auth-template').innerHTML;
  let mode = authStartMode || 'login';
  const roleSelect = app.querySelector('[name="role"]');
  renderRoleFields(roleSelect.value);
  roleSelect.onchange = () => renderRoleFields(roleSelect.value);
  app.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  app.querySelector('#signup-fields').classList.toggle('hidden', mode !== 'signup');
  app.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.onclick = () => {
      mode = btn.dataset.mode;
      app.querySelectorAll('.mode-btn').forEach((b) => b.classList.toggle('active', b === btn));
      app.querySelector('#signup-fields').classList.toggle('hidden', mode !== 'signup');
    };
  });
  app.querySelector('#auth-form').onsubmit = async (event) => {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const body = mode === 'signup'
        ? { ...form, email: form.identity, experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined, age: form.age ? Number(form.age) : undefined }
        : form.identity === 'admin' ? { username: 'admin', password: form.password } : { email: form.identity, password: form.password };
      const data = await api(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(body) });
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('hospital2050_token', state.token);
      localStorage.setItem('hospital2050_user', JSON.stringify(state.user));
      connectSocket();
      render();
    } catch (error) {
      app.querySelector('#auth-error').textContent = error.message;
    }
  };
}

function panel(title, body) { return `<section class="card"><h2 class="mb-3 text-xl font-black">${esc(title)}</h2>${body || '<p class="text-slate-400">No data yet.</p>'}</section>`; }
function patientOptions(users, selected = '') { return users.map((u) => `<option value="${u._id}" ${selected === u._id ? 'selected' : ''}>${esc(u.name)}${u.phone ? ` - ${esc(u.phone)}` : ''}</option>`).join(''); }

function layout(content) {
  applyTheme();
  const nav = state.user.role === 'admin'
    ? ['overview', 'admin', 'beds']
    : state.user.role === 'doctor'
      ? ['overview', 'appointments', 'history', 'ai', 'records', 'chat']
      : state.user.role === 'nurse'
        ? ['overview', 'monitoring', 'ai', 'chat']
        : ['overview', 'appointments', 'history', 'records', 'ai', 'chat'];
  document.getElementById('app').innerHTML = `
    <div class="shell grid min-h-screen grid-cols-[260px_1fr]">
      <aside class="glass sticky top-0 h-screen rounded-none p-4">
        <div class="mb-6"><p class="text-xs uppercase tracking-[.25em] text-cyan-300">LifeCare Hospital</p><h2 class="mt-2 text-xl font-black">${esc(state.user.name)}</h2><p class="text-sm capitalize text-slate-400">${esc(state.user.role)}${state.user.department ? ` - ${esc(state.user.department.name)}` : ''}</p></div>
        <nav class="space-y-2">${nav.map((item) => `<button class="nav-btn ${state.page === item ? 'active' : ''}" data-page="${item}">${t(item)}</button>`).join('')}</nav>
        <label class="mt-6">Language<select id="language-select" class="input">${Object.keys(labels).map((lang) => `<option ${state.user.language === lang ? 'selected' : ''}>${lang}</option>`).join('')}</select></label>
        <button id="theme-toggle" class="btn secondary mt-3 w-full">${state.theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</button>
        <button id="logout" class="btn secondary mt-6 w-full">Logout</button>
      </aside>
      <section class="p-4 md:p-8">
        <header class="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 class="text-3xl font-black">${t(state.page)}</h1><p class="text-slate-400">Live role-based hospital workflow.</p></div><div class="flex flex-wrap gap-2">${state.user.role === 'doctor' ? '<button id="voice-emergency" class="btn secondary">Voice Emergency Command</button><button id="emergency" class="btn danger">Emergency Alert</button>' : ''}${state.user.role === 'patient' ? '<button id="patient-emergency" class="btn danger">Emergency Alert</button>' : ''}</div></header>
        <div id="content">${content}</div>
      </section>
    </div>`;
  document.querySelectorAll('.nav-btn').forEach((btn) => btn.onclick = () => { state.page = btn.dataset.page; state.selectedAppointment = null; render(); });
  document.getElementById('language-select').onchange = async (event) => {
    const data = await api('/api/users/me', { method: 'PATCH', body: JSON.stringify({ language: event.target.value }) });
    state.user = data.user;
    localStorage.setItem('hospital2050_user', JSON.stringify(state.user));
    render();
  };
  document.getElementById('theme-toggle').onclick = () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('hospital2050_theme', state.theme);
    applyTheme();
    render();
  };
  document.getElementById('logout').onclick = () => { localStorage.removeItem('hospital2050_token'); localStorage.removeItem('hospital2050_user'); state.token = null; state.user = null; state.socket?.disconnect(); state.socket = null; render(); };
  const emergency = document.getElementById('emergency');
  if (emergency) emergency.onclick = async () => {
    await api('/api/emergency', { method: 'POST', body: JSON.stringify({ message: 'Critical emergency. Nurse assistance required immediately.' }) });
    toast('Emergency sent', 'All nurses were alerted.', 'Critical');
  };
  const patientEmergency = document.getElementById('patient-emergency');
  if (patientEmergency) patientEmergency.onclick = async () => {
    await api('/api/emergency', { method: 'POST', body: JSON.stringify({ message: `${state.user.name} requested emergency assistance.` }) });
    toast('Emergency sent', 'Your assigned doctor and nurses were alerted.', 'Critical');
    speak('Emergency alert sent to your care team.');
  };
  const voiceEmergency = document.getElementById('voice-emergency');
  if (voiceEmergency) voiceEmergency.onclick = startEmergencyCommand;
}

async function overview() {
  if (state.user.role === 'admin') return admin();
  const appointments = await api('/api/appointments').catch(() => []);
  const doctorStats = state.user.role === 'doctor' ? await api('/api/appointments/doctor-stats').catch(() => null) : null;
  const reminders = state.user.role === 'patient' ? await api('/api/reminders').catch(() => []) : [];
  return `<div class="grid-auto">${panel('Active Appointments', `<div class="text-4xl font-black text-cyan-300">${appointments.filter((a) => a.status !== 'completed' && a.status !== 'cancelled').length}</div>`)}${doctorStats ? panel('Doctor Workload', `<p>Admitted: <b>${doctorStats.admitted}</b></p><p>Completed: <b>${doctorStats.completed}</b></p><p>Emergency: <b class="text-rose-300">${doctorStats.emergency}</b></p>`) : ''}${panel('Voice Tools', `<button class="btn secondary" onclick="startVoice()">Start voice command</button><p id="voice-out" class="mt-3 text-slate-300"></p>`)}${state.user.role === 'patient' ? panel('Medicine Reminders', `<div class="text-4xl font-black text-emerald-300">${reminders.length}</div>`) : ''}</div><div class="mt-4">${await appointmentsView()}</div>`;
}

async function appointmentsView() {
  const departments = await api('/api/departments');
  const appointments = (await api('/api/appointments')).filter((a) => a.status !== 'completed' && a.status !== 'cancelled');
  const booking = state.user.role === 'patient' ? `<form id="book-form" class="card mb-4 grid gap-3 md:grid-cols-5"><select name="department" class="input" required><option value="">Department</option>${departments.map((d) => `<option value="${d._id}">${esc(d.name)}</option>`).join('')}</select><select name="doctor" class="input" required><option value="">Doctor</option></select><input name="date" type="date" class="input" required /><select name="slot" class="input" required><option value="">Slot</option></select><button class="btn">Book</button><input name="reason" class="input md:col-span-5" placeholder="Symptoms or reason" /></form>` : '';
  const rows = appointments.map((a) => `<tr class="border-t border-white/10"><td class="py-2">${esc(a.date)} ${esc(a.slot)}</td><td>${esc(a.patient?.name || '')}</td><td>${esc(a.doctor?.name || '')}</td><td>${esc(a.doctor?.consultationRoom || '-')}</td><td>${a.queueNumber}</td><td>${a.estimatedWaitingMinutes} min</td><td>${esc(a.status)}</td><td class="flex gap-2 py-2">${state.user.role === 'doctor' ? `<button class="btn secondary" data-view="${a._id}">View Detail</button>${a.status !== 'completed' ? `<button class="btn secondary" data-complete="${a._id}">Complete</button>` : ''}` : ''}${state.user.role === 'patient' ? `<button class="btn secondary" data-cancel="${a._id}">Cancel</button>` : ''}</td></tr>`).join('');
  return `${booking}${panel('Appointments', `<div class="overflow-auto"><table class="w-full min-w-[860px] text-left text-sm"><thead><tr class="text-slate-400"><th>Date</th><th>Patient</th><th>Doctor</th><th>Room</th><th>Queue</th><th>Wait</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div>`)}${state.selectedAppointment ? await appointmentDetail(state.selectedAppointment) : ''}`;
}

async function appointmentHistory() {
  const appointments = (await api('/api/appointments')).filter((a) => a.status === 'completed' || a.status === 'cancelled');
  const rows = appointments.map((a) => `<tr class="border-t border-white/10"><td class="py-2">${esc(a.date)} ${esc(a.slot)}</td><td>${esc(a.patient?.name || '')}</td><td>${esc(a.doctor?.name || '')}</td><td>${esc(a.status)}</td><td>${state.user.role === 'doctor' ? `<button class="btn secondary" data-view="${a._id}">View Detail</button>` : ''}</td></tr>`).join('');
  return panel('Appointment History', `<div class="overflow-auto"><table class="w-full min-w-[640px] text-left text-sm"><thead><tr class="text-slate-400"><th>Date</th><th>Patient</th><th>Doctor</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`) + (state.selectedAppointment ? await appointmentDetail(state.selectedAppointment) : '');
}

async function appointmentDetail(id) {
  const [a, reports, prescriptions] = await Promise.all([api(`/api/appointments/${id}`), api('/api/records/reports'), api('/api/records/prescriptions')]);
  const patientReports = reports.filter((r) => r.patient?._id === a.patient._id);
  const patientPrescriptions = prescriptions.filter((p) => p.patient?._id === a.patient._id);
  return `<div class="mt-4 grid gap-4 xl:grid-cols-[360px_1fr]">
    ${panel('Patient Detail', `<p><b>Name:</b> ${esc(a.patient.name)}</p><p><b>Age:</b> ${esc(a.patient.age || '-')}</p><p><b>Occupation:</b> ${esc(a.patient.occupation || '-')}</p><p><b>Blood:</b> ${esc(a.patient.bloodGroup || '-')}</p><p><b>Allergies:</b> ${esc((a.patient.allergies || []).join(', ') || '-')}</p><p><b>Reason:</b> ${esc(a.reason || '-')}</p><p><b>Room:</b> ${esc(a.doctor?.consultationRoom || '-')}</p><div class="mt-3 flex gap-2"><button class="btn secondary" onclick="startConversationCapture('${a._id}','${a.patient._id}')">Record Conversation</button><button class="btn secondary" onclick="stopConversationCapture()">Stop</button></div><pre id="conversation-out" class="mt-3 whitespace-pre-wrap text-xs text-cyan-100"></pre>`)}
    <div class="grid gap-4">${doctorRecordForms(a.patient._id, a._id)}${panel('Timeline', [...patientReports.map((r) => `Report: ${r.title}`), ...patientPrescriptions.map((p) => `Prescription: ${(p.medicines || []).map((m) => m.name).join(', ')}`)].map((x) => `<p class="border-t border-white/10 py-2">${esc(x)}</p>`).join(''))}${admitForm(a)}${nurseTaskForm()}</div>
  </div>`;
}

function admitForm(appointment) {
  return panel('Admit Patient', `<form id="admit-form" class="grid gap-3 md:grid-cols-4"><select name="bedType" class="input"><option>General</option><option>ICU</option></select><input name="ward" class="input" placeholder="Ward details" /><label class="mt-0 flex items-center gap-2 text-sm"><input name="emergency" type="checkbox" /> Emergency</label><input name="reason" class="input" placeholder="Admission reason" value="${esc(appointment.reason || '')}" /><button class="btn md:col-span-4">Assign Available Bed</button></form><p id="admit-out" class="mt-2 text-sm text-cyan-200"></p>`);
}

function nurseTaskForm() {
  return panel('Assign Nurse Task', `<form id="nurse-task-form" class="grid gap-3 md:grid-cols-4"><input name="title" class="input" placeholder="Task title" required /><select name="priority" class="input"><option>Medium</option><option>Low</option><option>High</option><option>Critical</option></select><input name="detail" class="input md:col-span-2" placeholder="Task details / ward instructions" /><button class="btn md:col-span-4">Send Task To Nurses</button></form><p id="nurse-task-out" class="mt-2 text-sm text-cyan-200"></p>`);
}

function doctorRecordForms(patientId, appointmentId = '') {
  const patientField = patientId
    ? `<input type="hidden" name="patient" value="${patientId}" />`
    : `<input name="patient" class="input" placeholder="Select patient" required />`;
  return `${panel('Add Report', `<form id="report-form">${patientField}<input name="title" class="input" placeholder="Report title" required /><input name="diagnosis" class="input" placeholder="Diagnosis" /><textarea name="notes" rows="3" placeholder="Clinical notes"></textarea><textarea name="doctorNotepad" rows="4" placeholder="Private notepad kept with this report"></textarea><input name="followUpDate" type="date" class="input" /><input name="files" type="file" multiple class="input" /><button class="btn mt-3">Save Report</button></form>`)}
  ${panel('Prescription Builder', `<form id="rx-form">${patientField}<input type="hidden" name="appointment" value="${appointmentId}" /><div id="medicine-list"></div><button type="button" class="btn secondary mt-3" id="add-med">Add Medicine</button><textarea name="notes" rows="3" placeholder="General instructions"></textarea><input name="followUpDate" type="date" class="input" /><button class="btn mt-3">Send Prescription</button></form>`)}
  ${panel('Follow Up', `<form id="follow-form"><input name="followUpDate" type="date" class="input" required /><input name="instructions" class="input" placeholder="Follow-up instructions" /><button class="btn mt-3">Send Follow-Up Alert</button></form>`)}`;
}

function medicineRow(index) {
  return `<div class="card mt-3 medicine-row"><strong>Medicine ${index}</strong><div class="grid gap-2 md:grid-cols-3"><input name="name" class="input" placeholder="Medicine name" required /><input name="doseCount" class="input" placeholder="No. of dose" /><input name="timing" class="input" placeholder="Morning / Night / After food" /><input name="duration" class="input" placeholder="Duration" /><input name="quantityTotal" type="number" class="input" placeholder="Total tablets" /><input name="instructions" class="input" placeholder="Instructions" /></div></div>`;
}

function bindAppointmentForm() {
  document.querySelectorAll('[data-view]').forEach((btn) => btn.onclick = () => { state.selectedAppointment = btn.dataset.view; render(); });
  document.querySelectorAll('[data-complete]').forEach((btn) => btn.onclick = async () => { await api(`/api/appointments/${btn.dataset.complete}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'completed' }) }); render(); });
  document.querySelectorAll('[data-cancel]').forEach((btn) => btn.onclick = async () => { await api(`/api/appointments/${btn.dataset.cancel}/cancel`, { method: 'PATCH' }); render(); });
  const form = document.getElementById('book-form');
  if (form) {
    form.department.onchange = async () => {
      const doctors = await api(`/api/departments/${form.department.value}/doctors`);
      form.doctor.innerHTML = '<option value="">Doctor</option>' + doctors.map((d) => `<option value="${d._id}">${esc(d.name)} - ${esc(d.specialization || 'Doctor')}</option>`).join('');
      form.slot.innerHTML = '<option value="">Slot</option>';
    };
    async function loadSlots() {
      if (!form.doctor.value || !form.date.value) return;
      const data = await api(`/api/appointments/slots?doctor=${form.doctor.value}&date=${form.date.value}`);
      form.slot.innerHTML = '<option value="">Slot</option>' + data.slots.map((s) => `<option>${s}</option>`).join('');
    }
    form.doctor.onchange = loadSlots;
    form.date.onchange = loadSlots;
    form.onsubmit = async (event) => { event.preventDefault(); await api('/api/appointments', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) }); toast('Appointment booked', 'Queue number generated.', 'Info'); render(); };
  }
}

async function aiCenter() {
  const features = { doctor: ['clinical-copilot', 'prescription-generator', 'drug-interaction-checker', 'suggested-tests', 'follow-up-planner', 'risk-detection', 'patient-summary'], nurse: ['shift-handover', 'alert-prioritization', 'daily-work-summary', 'patient-risk-summary'], patient: ['health-assistant', 'report-simplifier', 'prescription-simplifier', 'health-insights'] }[state.user.role] || ['health-assistant'];
  return `<div class="grid gap-4 lg:grid-cols-[1fr_360px]">${panel('AI Workspace', `<form id="ai-form"><select name="feature" class="input">${features.map((f) => `<option value="${f}">${f.replaceAll('-', ' ')}</option>`).join('')}</select><textarea name="input" rows="8" placeholder="Enter patient details, report text, prescription text, or question"></textarea><button class="btn mt-3">Generate Summary</button></form><pre id="ai-out" class="mt-4 whitespace-pre-wrap rounded-lg bg-black/30 p-4 text-sm text-cyan-50"></pre><button id="ai-speak" class="btn secondary mt-2">Read Aloud</button>`)}${state.user.role === 'patient' ? panel('Scan Report / Prescription / Medicine', `<form id="scan-form"><input name="image" type="file" accept="image/*" capture="environment" class="input" required /><button class="btn mt-3">Scan and Explain</button></form><pre id="scan-out" class="mt-4 whitespace-pre-wrap text-sm"></pre><button id="scan-speak" class="btn secondary mt-2">Read Aloud</button>`) : panel('Voice', `<button class="btn secondary" onclick="startDictation()">Dictate note</button><p id="dictation" class="mt-3 text-slate-300"></p>`)}</div>`;
}

function bindAI() {
  const form = document.getElementById('ai-form');
  if (form) form.onsubmit = async (event) => {
    event.preventDefault();
    const out = document.getElementById('ai-out');
    setLoading(out, 'Generating Summary...');
    try {
      const payload = Object.fromEntries(new FormData(form));
      const data = await api('/api/ai/text', { method: 'POST', body: JSON.stringify({ ...payload, language: state.user.language }) });
      out.textContent = data.response;
    } catch (error) { out.textContent = error.message; }
  };
  const aiSpeak = document.getElementById('ai-speak');
  if (aiSpeak) aiSpeak.onclick = () => speak(document.getElementById('ai-out')?.textContent || '');
  const scan = document.getElementById('scan-form');
  if (scan) scan.onsubmit = async (event) => {
    event.preventDefault();
    const out = document.getElementById('scan-out');
    setLoading(out, 'Processing Report...');
    try {
      const fd = new FormData(scan);
      fd.append('language', state.user.language);
      const data = await api('/api/records/prescriptions/scan', { method: 'POST', body: fd });
      out.textContent = `${data.response}\n\nReminder created.`;
    } catch (error) { out.textContent = error.message; }
  };
  const scanSpeak = document.getElementById('scan-speak');
  if (scanSpeak) scanSpeak.onclick = () => speak(document.getElementById('scan-out')?.textContent || '');
}

async function records() {
  const [reports, prescriptions, patients, reminders] = await Promise.all([
    api('/api/records/reports'),
    api('/api/records/prescriptions'),
    state.user.role === 'doctor' ? api('/api/users?role=patient') : Promise.resolve([]),
    state.user.role === 'patient' ? api('/api/reminders') : Promise.resolve([])
  ]);
  const doctorForm = state.user.role === 'doctor' ? `<div class="grid-auto mb-4">${doctorRecordForms('', '')}</div>` : '';
  const reportRows = reports.map((r) => `<div class="border-t border-white/10 py-3"><strong>${esc(r.title)}</strong><p class="text-sm text-slate-400">${esc(r.patient?.name || '')} - ${esc(r.diagnosis || '')}</p><p class="text-sm">${esc(r.notes || '')}</p>${r.doctorNotepad ? `<p class="mt-2 text-xs text-cyan-200">Notepad: ${esc(r.doctorNotepad)}</p>` : ''}<button class="btn secondary mt-2" data-report-ai="${r._id}">Explain My Report</button><button class="btn secondary mt-2" onclick="speak(document.getElementById('report-ai-${r._id}').textContent)">Read Aloud</button><pre id="report-ai-${r._id}" class="mt-2 whitespace-pre-wrap text-sm"></pre></div>`).join('');
  const prescriptionRows = prescriptions.map((p) => `<div class="border-t border-white/10 py-3"><strong>${esc(p.hospitalName || 'LifeCare Hospital')}</strong><p class="text-sm text-slate-400">${esc(p.patient?.name || '')} - Dr. ${esc(p.doctor?.name || '')}</p><p class="text-sm">${(p.medicines || []).map((m) => `${esc(m.name)} ${esc(m.doseCount || m.dosage || '')} ${esc(m.timing || m.frequency || '')}`).join('<br>')}</p>${state.user.role === 'patient' ? `<a class="btn secondary mt-2 inline-block" href="${API}/api/records/prescriptions/${p._id}/download?token=${state.token}">Download Prescription</a><button class="btn secondary mt-2" data-rx-ai="${p._id}">Explain Prescription</button><button class="btn secondary mt-2" onclick="speak(document.getElementById('rx-ai-${p._id}').textContent)">Read Aloud</button><pre id="rx-ai-${p._id}" class="mt-2 whitespace-pre-wrap text-sm"></pre>` : ''}</div>`).join('');
  const reminderUi = state.user.role === 'patient' ? panel('Medicine Reminders', `<form id="reminder-form" class="grid gap-2 md:grid-cols-5"><input name="medicineName" class="input" placeholder="Medicine" required /><input name="schedule" class="input" placeholder="Morning, Evening" /><input name="quantityTotal" type="number" class="input" placeholder="Total" /><input name="quantityLeft" type="number" class="input" placeholder="Left" /><button class="btn">Add</button></form>${reminders.map((r) => `<div class="border-t border-white/10 py-3"><strong>${esc(r.medicineName)}</strong><p>${esc((r.schedule || []).join(', '))} - Left: ${r.quantityLeft || 0}</p><button class="btn secondary" data-take="${r._id}">Mark Taken</button></div>`).join('')}`) : '';
  setTimeout(() => hydratePatientDropdowns(patients), 0);
  return `${doctorForm}<div class="grid-auto">${panel('Reports', reportRows)}${panel('Prescriptions', prescriptionRows)}${reminderUi}</div>`;
}

function hydratePatientDropdowns(patients) {
  if (!patients.length) return;
  document.querySelectorAll('input[name="patient"]').forEach((input) => {
    if (input.type === 'hidden') return;
    const select = document.createElement('select');
    select.name = 'patient';
    select.className = 'input';
    select.required = true;
    select.innerHTML = `<option value="">Select patient</option>${patientOptions(patients)}`;
    input.replaceWith(select);
  });
}

function bindRecords() {
  const medList = document.getElementById('medicine-list');
  const addMed = document.getElementById('add-med');
  if (medList && addMed) {
    if (!medList.children.length) medList.insertAdjacentHTML('beforeend', medicineRow(1));
    addMed.onclick = () => medList.insertAdjacentHTML('beforeend', medicineRow(medList.children.length + 1));
  }
  const report = document.getElementById('report-form');
  if (report) report.onsubmit = async (event) => { event.preventDefault(); await api('/api/records/reports', { method: 'POST', body: new FormData(report) }); toast('Report saved', 'Patient received the record.', 'Info'); render(); };
  const rx = document.getElementById('rx-form');
  if (rx) rx.onsubmit = async (event) => {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(rx));
    const medicines = [...rx.querySelectorAll('.medicine-row')].map((row) => Object.fromEntries([...row.querySelectorAll('input')].map((input) => [input.name, input.value]))).filter((m) => m.name);
    await api('/api/records/prescriptions', { method: 'POST', body: JSON.stringify({ patient: form.patient, appointment: form.appointment, medicines, notes: form.notes, followUpDate: form.followUpDate }) });
    toast('Prescription sent', 'Patient can now download it.', 'Info');
    render();
  };
  const follow = document.getElementById('follow-form');
  if (follow && state.selectedAppointment) follow.onsubmit = async (event) => { event.preventDefault(); await api(`/api/appointments/${state.selectedAppointment}/follow-up`, { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(follow))) }); toast('Follow-up sent', 'Patient was notified.', 'Info'); };
  const admit = document.getElementById('admit-form');
  if (admit && state.selectedAppointment) admit.onsubmit = async (event) => {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(admit));
    form.emergency = admit.emergency.checked;
    const out = document.getElementById('admit-out');
    try {
      const bed = await api(`/api/appointments/${state.selectedAppointment}/admit`, { method: 'POST', body: JSON.stringify(form) });
      const msg = `Assigned bed ${bed.code} in ${bed.ward || bed.type}.`;
      out.textContent = msg;
      toast('Patient admitted', msg, form.emergency ? 'Critical' : 'High');
      speak(msg);
    } catch (error) {
      out.textContent = error.message;
    }
  };
  const nurseTask = document.getElementById('nurse-task-form');
  if (nurseTask && state.selectedAppointment) nurseTask.onsubmit = async (event) => {
    event.preventDefault();
    const out = document.getElementById('nurse-task-out');
    try {
      await api(`/api/appointments/${state.selectedAppointment}/nurse-task`, { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(nurseTask))) });
      out.textContent = 'Task sent to nurses.';
      speak('Task sent to nurses.');
    } catch (error) {
      out.textContent = error.message;
    }
  };
  document.querySelectorAll('[data-rx-ai]').forEach((btn) => btn.onclick = async () => {
    const out = document.getElementById(`rx-ai-${btn.dataset.rxAi}`);
    setLoading(out, 'Analyzing...');
    try { out.textContent = (await api(`/api/records/prescriptions/${btn.dataset.rxAi}/simplify`, { method: 'POST', body: JSON.stringify({ language: state.user.language }) })).response; } catch (e) { out.textContent = e.message; }
  });
  document.querySelectorAll('[data-report-ai]').forEach((btn) => btn.onclick = async () => {
    const out = document.getElementById(`report-ai-${btn.dataset.reportAi}`);
    setLoading(out, 'Analyzing...');
    try { out.textContent = (await api(`/api/records/reports/${btn.dataset.reportAi}/simplify`, { method: 'POST', body: JSON.stringify({ language: state.user.language }) })).response; } catch (e) { out.textContent = e.message; }
  });
  const reminder = document.getElementById('reminder-form');
  if (reminder) reminder.onsubmit = async (event) => { event.preventDefault(); const form = Object.fromEntries(new FormData(reminder)); await api('/api/reminders', { method: 'POST', body: JSON.stringify({ ...form, schedule: (form.schedule || '').split(',').map((x) => x.trim()).filter(Boolean) }) }); render(); };
  document.querySelectorAll('[data-take]').forEach((btn) => btn.onclick = async () => { await api(`/api/reminders/${btn.dataset.take}/take`, { method: 'PATCH', body: JSON.stringify({ amount: 1 }) }); render(); });
}

async function monitoring() {
  const [vitals, patients, tasks] = await Promise.all([api('/api/nurse/vitals'), api('/api/nurse/assigned-patients'), api('/api/nurse/tasks')]);
  return `${panel('Smart Task Manager', tasks.map((task) => `<div class="border-t border-white/10 py-2"><strong class="${task.priority === 'Critical' ? 'text-rose-300' : task.priority === 'High' ? 'text-amber-300' : 'text-cyan-200'}">${esc(task.priority)}</strong> ${esc(task.title)}<p class="text-sm text-slate-400">${esc(task.detail || '')}</p></div>`).join(''))}${panel('Add Vitals', `<form id="vital-form" class="grid gap-3 md:grid-cols-6"><select name="patient" class="input" required><option value="">Select patient</option>${patientOptions(patients)}</select><input name="bloodPressure" class="input" placeholder="BP" /><input name="temperature" type="number" step=".1" class="input" placeholder="Temp" /><input name="pulse" type="number" class="input" placeholder="Pulse" /><input name="oxygenLevel" type="number" class="input" placeholder="SpO2" /><button class="btn">Save</button></form>`)}<div class="mt-4">${panel('Patient Monitoring', vitals.map((v) => `<div class="border-t border-white/10 py-3">${esc(v.patient?.name || v.patient)} - BP ${esc(v.bloodPressure || '-')} - Temp ${esc(v.temperature || '-')} - Pulse ${esc(v.pulse || '-')} - SpO2 ${esc(v.oxygenLevel || '-')} - <strong>${esc(v.riskLevel)}</strong></div>`).join(''))}</div>`;
}

async function chat() {
  const users = state.user.role === 'patient' ? await api('/api/users?role=nurse').catch(() => []) : await api('/api/users').catch(() => []);
  const messages = await api('/api/messages');
  return panel('Care Team Chat', `<form id="msg-form" class="mb-4 grid gap-3 md:grid-cols-[1fr_2fr_auto]"><select name="to" class="input"><option value="">Broadcast / department</option>${users.filter((u) => u._id !== state.user._id).map((u) => `<option value="${u._id}">${esc(u.name)} - ${esc(u.role)}</option>`).join('')}</select><input name="body" class="input" placeholder="Message" required /><button class="btn">Send</button></form>${messages.map((m) => `<div class="border-t border-white/10 py-3"><strong>${esc(m.from?.name || '')}</strong><p class="text-slate-300">${esc(m.body)}</p></div>`).join('')}`);
}

async function beds() {
  const beds = await api('/api/nurse/beds');
  const adminForm = state.user.role === 'admin' ? panel('Add / Edit Bed', `<form id="bed-form" class="grid gap-3 md:grid-cols-4"><input name="code" class="input" placeholder="Bed code" required /><select name="type" class="input"><option>General</option><option>ICU</option><option>Emergency</option></select><select name="status" class="input"><option>available</option><option>occupied</option><option>maintenance</option></select><input name="ward" class="input" placeholder="Ward" /><button class="btn md:col-span-4">Save Bed</button></form>`) : '';
  return `${adminForm}<div class="grid-auto mt-4">${beds.map((b) => `<div class="card"><strong>${esc(b.code)}</strong><p>${esc(b.type)} - ${esc(b.ward || '')}</p><p class="${b.status === 'available' ? 'text-emerald-300' : 'text-rose-300'}">${esc(b.status)}</p>${state.user.role === 'admin' ? `<button class="btn secondary mt-2" data-edit-bed="${esc(b.code)}" data-type="${esc(b.type)}" data-status="${esc(b.status)}" data-ward="${esc(b.ward || '')}">Edit</button>` : ''}</div>`).join('')}</div>`;
}

async function admin() {
  const data = await api('/api/admin/analytics');
  setTimeout(() => drawChart(data.departmentAnalytics), 0);
  return `<div class="grid-auto">${Object.entries(data.totals).map(([k, v]) => panel(k.replaceAll(/([A-Z])/g, ' $1'), `<div class="text-4xl font-black text-cyan-300">${v}</div>`)).join('')}</div>
  <div class="mt-4 grid gap-4 lg:grid-cols-[360px_1fr]">
    ${panel('Add Patient', `<form id="admin-patient-form"><input name="name" class="input" placeholder="Patient name" required /><input name="email" type="email" class="input" placeholder="Email" required /><input name="phone" class="input" placeholder="Phone" /><input name="occupation" class="input" placeholder="Occupation" /><input name="age" type="number" class="input" placeholder="Age" /><input name="bloodGroup" class="input" placeholder="Blood group" /><button class="btn mt-3">Add Patient</button></form><p id="admin-patient-out" class="mt-2 text-sm text-cyan-200"></p>`)}
    ${panel('Admitted Patients', (data.admitted || []).map((bed) => `<div class="border-t border-white/10 py-2"><strong>${esc(bed.patient?.name || '')}</strong><p>Bed ${esc(bed.code)} - ${esc(bed.ward || bed.type)} - Dr. ${esc(bed.assignedDoctor?.name || '-')}</p></div>`).join(''))}
  </div>
  ${panel('Department Performance', '<canvas id="dept-chart" height="110"></canvas>')}${panel('Bed Analytics', `<p>Occupancy Rate: ${data.bedAnalytics.occupancyRate}%</p><p>ICU Usage: ${data.bedAnalytics.icuUsage}%</p><p>Emergency Available: ${data.bedAnalytics.emergencyBedAvailability}</p>`)}`;
}

function drawChart(rows) {
  const canvas = document.getElementById('dept-chart');
  if (!canvas || !window.Chart) return;
  new Chart(canvas, { type: 'bar', data: { labels: rows.map((r) => r.department), datasets: [{ label: 'Appointments', data: rows.map((r) => r.appointments), backgroundColor: '#22d3ee' }, { label: 'Doctors', data: rows.map((r) => r.doctors), backgroundColor: '#a855f7' }] }, options: { plugins: { legend: { labels: { color: '#e2e8f0' } } }, scales: { x: { ticks: { color: '#cbd5e1' } }, y: { ticks: { color: '#cbd5e1' } } } } });
}

async function render() {
  if (!state.token || !state.user) return homeScreen();
  connectSocket();
  let content = '';
  try {
    if (state.page === 'overview') content = await overview();
    if (state.page === 'appointments') content = await appointmentsView();
    if (state.page === 'history') content = await appointmentHistory();
    if (state.page === 'ai') content = await aiCenter();
    if (state.page === 'records') content = await records();
    if (state.page === 'monitoring') content = await monitoring();
    if (state.page === 'beds') content = await beds();
    if (state.page === 'chat') content = await chat();
    if (state.page === 'admin') content = await admin();
  } catch (error) { content = panel('Error', `<p class="text-rose-300">${esc(error.message)}</p>`); }
  layout(content);
  setTimeout(() => { bindAppointmentForm(); bindAI(); bindRecords(); bindExtraForms(); }, 0);
}

function bindExtraForms() {
  const vital = document.getElementById('vital-form');
  if (vital) vital.onsubmit = async (event) => { event.preventDefault(); await api('/api/nurse/vitals', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(vital))) }); render(); };
  const msg = document.getElementById('msg-form');
  if (msg) msg.onsubmit = async (event) => { event.preventDefault(); await api('/api/messages', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(msg))) }); render(); };
  const bedForm = document.getElementById('bed-form');
  if (bedForm) bedForm.onsubmit = async (event) => {
    event.preventDefault();
    await api('/api/nurse/beds', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(bedForm))) });
    toast('Bed saved', 'Bed record updated.', 'Info');
    render();
  };
  document.querySelectorAll('[data-edit-bed]').forEach((btn) => btn.onclick = () => {
    const form = document.getElementById('bed-form');
    if (!form) return;
    form.code.value = btn.dataset.editBed;
    form.type.value = btn.dataset.type;
    form.status.value = btn.dataset.status;
    form.ward.value = btn.dataset.ward;
  });
  const adminPatient = document.getElementById('admin-patient-form');
  if (adminPatient) adminPatient.onsubmit = async (event) => {
    event.preventDefault();
    const out = document.getElementById('admin-patient-out');
    try {
      const data = await api('/api/admin/patients', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(adminPatient))) });
      out.textContent = `Patient added. Temporary password: ${data.temporaryPassword}`;
      speak(`Patient ${data.patient.name} added.`);
    } catch (error) {
      out.textContent = error.message;
    }
  };
}

window.startVoice = function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return toast('Voice unavailable', 'Speech recognition is not supported in this browser.');
  const rec = new SpeechRecognition();
  rec.lang = 'en-US';
  rec.onresult = (event) => {
    const text = event.results[0][0].transcript;
    const out = document.getElementById('voice-out');
    if (out) out.textContent = text;
    if (/generate prescription/i.test(text)) { state.page = 'ai'; render(); }
    if (/open patient report/i.test(text)) { state.page = 'records'; render(); }
  };
  rec.start();
};

window.startDictation = function startDictation() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return toast('Voice unavailable', 'Speech recognition is not supported.');
  const rec = new SpeechRecognition();
  rec.onresult = (event) => {
    const target = document.getElementById('dictation');
    if (target) target.textContent = event.results[0][0].transcript;
  };
  rec.start();
};

window.startConversationCapture = function startConversationCapture(appointment, patient) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const out = document.getElementById('conversation-out');
  if (!SpeechRecognition) { out.textContent = 'Speech recognition is not supported in this browser.'; return; }
  if (state.conversationRecognition) state.conversationRecognition.stop();
  state.voiceTranscript = '';
  const rec = new SpeechRecognition();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = 'en-US';
  state.conversation = { appointment, patient };
  state.conversationRecognition = rec;
  out.textContent = 'Recording... press Stop when finished.';
  rec.onresult = (event) => {
    state.voiceTranscript = [...event.results].map((result) => result[0].transcript).join(' ');
    out.textContent = state.voiceTranscript;
  };
  rec.start();
};

window.stopConversationCapture = async function stopConversationCapture() {
  const out = document.getElementById('conversation-out');
  if (state.conversationRecognition) state.conversationRecognition.stop();
  if (!state.conversation || !state.voiceTranscript.trim()) {
    if (out) out.textContent = 'No transcript captured.';
    return;
  }
  out.innerHTML = `${esc(state.voiceTranscript)}<br><br><span class="loading">Generating Summary...</span>`;
  try {
    const saved = await api('/api/conversations', { method: 'POST', body: JSON.stringify({ ...state.conversation, transcript: state.voiceTranscript, language: state.user.language }) });
    out.textContent = `${saved.transcript}\n\nAI Insights:\n${saved.aiInsights}`;
    out.insertAdjacentHTML('afterend', `<button class="btn secondary mt-2" onclick="speak(document.getElementById('conversation-out').textContent)">Read Aloud</button>`);
  } catch (error) { out.textContent = error.message; }
};

window.startEmergencyCommand = function startEmergencyCommand() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return toast('Voice unavailable', 'Speech recognition is not supported.');
  const rec = new SpeechRecognition();
  rec.lang = 'en-US';
  rec.onresult = async (event) => {
    const command = event.results[0][0].transcript;
    toast('Voice command', command, 'Info');
    try {
      const bed = await api('/api/emergency/voice-command', { method: 'POST', body: JSON.stringify({ command }) });
      const msg = `Admitted ${bed.patient?.name || 'patient'} to ${bed.ward || bed.type}, bed ${bed.code}.`;
      toast('Emergency admission', msg, 'Critical');
      speak(msg);
    } catch (error) {
      toast('Command failed', error.message, 'High');
    }
  };
  rec.start();
};

render();
