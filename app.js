/* ============================================================
   Keuangan TMRIZK — app.js
   ============================================================ */

const supa = window.supabase.createClient(SUPA_URL, SUPA_ANON_KEY);

let session = null;
let viewDate = new Date();
let currentTab = 'beranda';
let chart = null;

let accounts = [];
let transactions = [];
let budgets = [];
let goals = [];
let recurring = [];

let editingTxId = null;
let editingAcctId = null;
let editingBudgetId = null;
let editingGoalId = null;
let editingRecurId = null;

const $ = (id) => document.getElementById(id);
const rupiah = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID');
const pad2 = (n) => String(n).padStart(2, '0');
const todayStr = () => new Date().toISOString().slice(0, 10);
const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAY_NAMES = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

function toast(msg){
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._h);
  toast._h = setTimeout(() => t.classList.remove('show'), 2200);
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function emptyState(icon, html){
  return `<div class="empty-state"><div class="eic2">${icon}</div>${html}</div>`;
}

/* ---------------- Auth ---------------- */

async function initAuth(){
  const { data } = await supa.auth.getSession();
  session = data.session;
  supa.auth.onAuthStateChange((_event, s) => {
    session = s;
    renderShell();
  });
  renderShell();
}

$('btnGoogleLogin').addEventListener('click', async () => {
  $('loginError').classList.add('hidden');
  const { error } = await supa.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
  if (error){
    $('loginError').textContent = error.message;
    $('loginError').classList.remove('hidden');
  }
});

$('btnLogout').addEventListener('click', async () => {
  await supa.auth.signOut();
});

function renderShell(){
  if (session){
    $('loginView').classList.add('hidden');
    $('mainView').classList.remove('hidden');
    $('mainView').style.display = 'flex';
    const u = session.user;
    const meta = u.user_metadata || {};
    $('userName').textContent = meta.full_name || meta.name || u.email;
    $('userAvatar').src = meta.avatar_url || meta.picture || '';
    loadAll();
  } else {
    $('mainView').classList.add('hidden');
    $('mainView').style.display = 'none';
    $('loginView').classList.remove('hidden');
  }
}

/* ---------------- Load data ---------------- */

async function loadAll(){
  const uid = session.user.id;
  const [accRes, txRes, budRes, goalRes, recRes] = await Promise.all([
    supa.from('accounts').select('*').order('created_at'),
    supa.from('transactions').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }),
    supa.from('budgets').select('*'),
    supa.from('goals').select('*').order('created_at'),
    supa.from('recurring').select('*').order('created_at')
  ]);
  if (accRes.error) return toast('Gagal memuat akun: ' + accRes.error.message);
  if (txRes.error) return toast('Gagal memuat transaksi: ' + txRes.error.message);

  accounts = accRes.data || [];
  transactions = txRes.data || [];
  budgets = budRes.data || [];
  goals = goalRes.data || [];
  recurring = recRes.data || [];

  const generated = await runRecurringGeneration(uid);
  if (generated){
    const { data } = await supa.from('transactions').select('*')
      .order('date', { ascending: false }).order('created_at', { ascending: false });
    transactions = data || [];
  }

  renderAll();
}

async function runRecurringGeneration(uid){
  const now = new Date();
  const ym = now.getFullYear() + '-' + pad2(now.getMonth() + 1);
  const dom = now.getDate();
  let did = false;
  for (const r of recurring){
    if (!r.active) continue;
    if (r.last_generated === ym) continue;
    if (dom < r.day_of_month) continue;
    const date = ym + '-' + pad2(r.day_of_month);
    const { error: insErr } = await supa.from('transactions').insert({
      user_id: uid, account_id: r.account_id, type: r.type, category: r.category,
      amount: r.amount, note: r.note || ('Otomatis: ' + r.category), date
    });
    if (insErr) continue;
    await supa.from('recurring').update({ last_generated: ym }).eq('id', r.id);
    r.last_generated = ym;
    did = true;
  }
  return did;
}

/* ---------------- Derived helpers ---------------- */

function monthRange(d){
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  const ymd = (x) => x.toISOString().slice(0, 10);
  return { start: ymd(start), end: ymd(end) };
}
function txInMonth(){
  const { start, end } = monthRange(viewDate);
  return transactions.filter((t) => t.date >= start && t.date < end);
}
function accountBalance(id){
  const acc = accounts.find((a) => a.id === id);
  if (!acc) return 0;
  let bal = Number(acc.initial_balance) || 0;
  for (const t of transactions){
    const amt = Number(t.amount) || 0;
    if (t.type === 'pemasukan' && t.account_id === id) bal += amt;
    else if (t.type === 'pengeluaran' && t.account_id === id) bal -= amt;
    else if (t.type === 'transfer'){
      if (t.account_id === id) bal -= amt;
      if (t.to_account_id === id) bal += amt;
    }
  }
  return bal;
}
function totalBalance(){
  return accounts.reduce((s, a) => s + accountBalance(a.id), 0);
}
function goalProgress(id){
  return transactions.filter((t) => t.goal_id === id).reduce((s, t) => s + (Number(t.amount) || 0), 0);
}
function budgetSpent(category){
  return txInMonth().filter((t) => t.type === 'pengeluaran' && t.category === category)
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);
}
function accountName(id){
  const a = accounts.find((x) => x.id === id);
  return a ? a.name : '-';
}

/* ---------------- Tabs ---------------- */

const TAB_TITLES = { beranda: 'Beranda', transaksi: 'Transaksi', anggaran: 'Anggaran', tabungan: 'Tabungan', akun: 'Akun' };
const TABS_WITH_MONTH = ['beranda', 'transaksi', 'anggaran'];

function setTab(tab){
  currentTab = tab;
  document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-view').forEach((v) => v.classList.toggle('active', v.dataset.tab === tab));
  $('headerTitle').textContent = TAB_TITLES[tab];
  $('monthNavWrap').classList.toggle('hidden', !TABS_WITH_MONTH.includes(tab));
}
document.querySelectorAll('.tabbar button').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
document.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.goto)));

$('prevMonth').addEventListener('click', () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1); renderAll(); });
$('nextMonth').addEventListener('click', () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1); renderAll(); });

/* ---------------- Render: all ---------------- */

function renderAll(){
  $('monthLabel').textContent = MONTH_NAMES[viewDate.getMonth()] + ' ' + viewDate.getFullYear();
  renderBeranda();
  renderTransaksiTab();
  renderAnggaranTab();
  renderTabunganTab();
  renderAkunTab();
}

/* ---------------- Beranda ---------------- */

function renderBeranda(){
  $('totalSaldo').textContent = rupiah(totalBalance());

  const mtx = txInMonth();
  let totalIn = 0, totalOut = 0;
  for (const t of mtx){
    if (t.type === 'pemasukan') totalIn += Number(t.amount);
    else if (t.type === 'pengeluaran') totalOut += Number(t.amount);
  }
  $('sumIn').textContent = rupiah(totalIn);
  $('sumOut').textContent = rupiah(totalOut);
  $('sumSaldo').textContent = rupiah(totalIn - totalOut);

  const byCat = {};
  for (const t of mtx){
    if (t.type !== 'pengeluaran') continue;
    byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount);
  }
  const labels = Object.keys(byCat), values = Object.values(byCat);
  if (!labels.length){
    $('catChart').classList.add('hidden');
    $('catChartEmpty').classList.remove('hidden');
    if (chart){ chart.destroy(); chart = null; }
  } else {
    $('catChart').classList.remove('hidden');
    $('catChartEmpty').classList.add('hidden');
    const palette = ['#16A085','#E4572E','#F2B134','#4A6FA5','#9B5DE5','#00BBF9','#F15BB5','#845EC2'];
    if (chart) chart.destroy();
    chart = new Chart($('catChart').getContext('2d'), {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: palette, borderWidth: 0 }] },
      options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } }, cutout: '62%' }
    });
  }

  const bp = $('budgetPreview');
  bp.innerHTML = '';
  if (!budgets.length){
    bp.innerHTML = emptyState('📊', 'Belum ada anggaran diatur.');
  } else {
    for (const b of budgets.slice(0, 3)) bp.appendChild(budgetCardEl(b));
  }

  const rt = $('recentTx');
  rt.innerHTML = '';
  const recent = transactions.slice(0, 5);
  if (!recent.length){
    rt.innerHTML = emptyState('🧾', 'Belum ada transaksi.<br>Tekan tombol + untuk mulai mencatat.');
  } else {
    for (const t of recent) rt.appendChild(txRowEl(t));
  }
}

/* ---------------- Transaksi ---------------- */

function renderTransaksiTab(){
  const box = $('txList');
  box.innerHTML = '';
  const mtx = txInMonth();
  if (!mtx.length){
    box.innerHTML = emptyState('🧾', 'Belum ada transaksi bulan ini.<br>Tekan tombol + untuk mulai mencatat.');
    return;
  }
  const groups = {};
  for (const t of mtx) (groups[t.date] ||= []).push(t);
  for (const date of Object.keys(groups).sort((a, b) => b.localeCompare(a))){
    const d = new Date(date + 'T00:00:00');
    const lbl = document.createElement('div');
    lbl.className = 'day-lbl';
    lbl.textContent = DAY_NAMES[d.getDay()] + ', ' + d.getDate() + ' ' + MONTH_NAMES[d.getMonth()];
    box.appendChild(lbl);
    for (const t of groups[date]) box.appendChild(txRowEl(t));
  }
}

function txRowEl(t){
  const row = document.createElement('div');
  row.className = 'tx ' + t.type;
  const icon = t.type === 'transfer' ? '⇄' : (CATEGORY_ICONS[t.category] || (t.type === 'pemasukan' ? '↓' : '↑'));
  const sign = t.type === 'pemasukan' ? '+' : (t.type === 'transfer' ? '' : '-');
  const catLabel = t.type === 'transfer'
    ? (accountName(t.account_id) + ' → ' + accountName(t.to_account_id))
    : escapeHtml(t.category);
  row.innerHTML = `
    <div class="icon">${icon}</div>
    <div class="mid">
      <div class="cat">${catLabel}</div>
      <div class="note">${escapeHtml(t.note || accountName(t.account_id))}</div>
    </div>
    <div class="amt">${sign}${rupiah(t.amount)}</div>
  `;
  row.addEventListener('click', () => openTxSheet(t));
  return row;
}

/* ---------------- Anggaran ---------------- */

function budgetCardEl(b){
  const spent = budgetSpent(b.category);
  const pct = Math.min(100, Math.round((spent / Number(b.limit_amount)) * 100));
  const cls = spent > Number(b.limit_amount) ? 'over' : (pct >= 80 ? 'warn' : '');
  const el = document.createElement('div');
  el.className = 'prog-card';
  el.innerHTML = `
    <div class="icon-box">${CATEGORY_ICONS[b.category] || '📊'}</div>
    <div class="pc-body">
      <div class="top">
        <div><div class="name">${escapeHtml(b.category)}</div><div class="sub">${pct}% terpakai</div></div>
        <div class="amt">${rupiah(spent)}<br>dari ${rupiah(b.limit_amount)}</div>
      </div>
      <div class="prog-bar"><div class="fill ${cls}" style="width:${pct}%"></div></div>
    </div>
  `;
  el.addEventListener('click', () => openBudgetSheet(b));
  return el;
}

function renderAnggaranTab(){
  const box = $('budgetList');
  box.innerHTML = '';
  if (!budgets.length){
    box.innerHTML = emptyState('📊', 'Belum ada anggaran.<br>Tekan tombol + untuk atur limit per kategori.');
    return;
  }
  for (const b of budgets) box.appendChild(budgetCardEl(b));
}

/* ---------------- Tabungan ---------------- */

function goalCardEl(g){
  const cur = goalProgress(g.id);
  const pct = Math.min(100, Math.round((cur / Number(g.target_amount)) * 100));
  const el = document.createElement('div');
  el.className = 'prog-card';
  const dateLbl = g.target_date ? ('Target: ' + g.target_date) : '';
  el.innerHTML = `
    <div class="icon-box">🎯</div>
    <div class="pc-body">
      <div class="top">
        <div><div class="name">${escapeHtml(g.name)}</div><div class="sub">${dateLbl}</div></div>
        <div class="amt">${rupiah(cur)}<br>dari ${rupiah(g.target_amount)}</div>
      </div>
      <div class="prog-bar"><div class="fill" style="width:${pct}%"></div></div>
    </div>
  `;
  el.addEventListener('click', () => openGoalSheet(g));
  return el;
}

function renderTabunganTab(){
  const box = $('goalList');
  box.innerHTML = '';
  if (!goals.length){
    box.innerHTML = emptyState('🎯', 'Belum ada target tabungan.<br>Tekan tombol + untuk bikin target baru.');
    return;
  }
  for (const g of goals) box.appendChild(goalCardEl(g));
}

/* ---------------- Akun ---------------- */

function renderAkunTab(){
  const box = $('accountList');
  box.innerHTML = '';
  if (!accounts.length){
    box.innerHTML = emptyState('👛', 'Belum ada akun.<br>Tekan tombol + untuk tambah akun (Cash, Bank, E-wallet, dll).');
  } else {
    for (const a of accounts){
      const t = ACCOUNT_TYPES[a.type] || ACCOUNT_TYPES.lainnya;
      const el = document.createElement('div');
      el.className = 'acct-card';
      el.innerHTML = `
        <div class="icon-box">${t.icon}</div>
        <div class="mid"><div class="name">${escapeHtml(a.name)}</div><div class="type">${t.label}</div></div>
        <div class="bal">${rupiah(accountBalance(a.id))}</div>
      `;
      el.addEventListener('click', () => openAcctSheet(a));
      box.appendChild(el);
    }
  }

  const rl = $('recurringList');
  rl.innerHTML = '';
  if (!recurring.length){
    rl.innerHTML = emptyState('🔁', 'Belum ada transaksi berulang.');
    return;
  }
  for (const r of recurring){
    const el = document.createElement('div');
    el.className = 'recur-item' + (r.active ? '' : ' inactive');
    const sign = r.type === 'pemasukan' ? '+' : '-';
    el.innerHTML = `
      <div class="icon-box">${CATEGORY_ICONS[r.category] || '🔁'}</div>
      <div class="mid">
        <div class="cat">${escapeHtml(r.category)}</div>
        <div class="sub">${accountName(r.account_id)} · tgl ${r.day_of_month} tiap bulan${r.active ? '' : ' · nonaktif'}</div>
      </div>
      <div class="amt">${sign}${rupiah(r.amount)}</div>
    `;
    el.addEventListener('click', () => openRecurSheet(r));
    rl.appendChild(el);
  }
}

/* ================================================================
   Sheet: Transaksi
   ================================================================ */

let txType = 'pengeluaran';

function fillAccountSelect(sel, excludeId){
  sel.innerHTML = '';
  for (const a of accounts){
    if (a.id === excludeId) continue;
    const opt = document.createElement('option');
    opt.value = a.id; opt.textContent = a.name;
    sel.appendChild(opt);
  }
}
function fillTxCategorySelect(){
  const sel = $('fCategory');
  const prev = sel.value;
  sel.innerHTML = '';
  for (const c of DEFAULT_CATEGORIES[txType]){
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    sel.appendChild(opt);
  }
  if (DEFAULT_CATEGORIES[txType].includes(prev)) sel.value = prev;
}
function fillGoalSelect(){
  const sel = $('fGoal');
  sel.innerHTML = '<option value="">Tidak ada</option>';
  for (const g of goals){
    const opt = document.createElement('option');
    opt.value = g.id; opt.textContent = g.name;
    sel.appendChild(opt);
  }
}

function setTxType(type){
  txType = type;
  $('typePengeluaran').classList.toggle('active', type === 'pengeluaran');
  $('typePemasukan').classList.toggle('active', type === 'pemasukan');
  $('typeTransfer').classList.toggle('active', type === 'transfer');
  $('fAccountLabel').textContent = type === 'transfer' ? 'Dari akun' : 'Akun';
  $('fToAccountWrap').classList.toggle('hidden', type !== 'transfer');
  $('fCategoryWrap').classList.toggle('hidden', type === 'transfer');
  $('fGoalWrap').classList.toggle('hidden', type !== 'pengeluaran');
  if (type !== 'transfer') fillTxCategorySelect();
  fillAccountSelect($('fToAccount'), $('fAccount').value);
}
$('typePengeluaran').addEventListener('click', () => setTxType('pengeluaran'));
$('typePemasukan').addEventListener('click', () => setTxType('pemasukan'));
$('typeTransfer').addEventListener('click', () => setTxType('transfer'));
$('fAccount').addEventListener('change', () => fillAccountSelect($('fToAccount'), $('fAccount').value));

function openTxSheet(tx, presetGoalId){
  if (!accounts.length){ toast('Tambah akun dulu di tab Akun'); setTab('akun'); return; }
  editingTxId = tx ? tx.id : null;
  $('txSheetTitle').textContent = tx ? 'Edit Transaksi' : 'Tambah Transaksi';
  $('txDelete').classList.toggle('hidden', !tx);
  fillAccountSelect($('fAccount'));
  fillGoalSelect();
  setTxType(tx ? tx.type : 'pengeluaran');
  $('fAmount').value = tx ? tx.amount : '';
  $('fAccount').value = tx ? tx.account_id : accounts[0].id;
  fillAccountSelect($('fToAccount'), $('fAccount').value);
  if (tx && tx.type === 'transfer') $('fToAccount').value = tx.to_account_id;
  $('fCategory').value = tx ? tx.category : DEFAULT_CATEGORIES[txType][0];
  $('fGoal').value = (tx && tx.goal_id) ? tx.goal_id : (presetGoalId || '');
  $('fDate').value = tx ? tx.date : todayStr();
  $('fNote').value = tx ? (tx.note || '') : '';
  $('txOverlay').classList.add('show');
}
function closeTxSheet(){ $('txOverlay').classList.remove('show'); editingTxId = null; }
$('txCancel').addEventListener('click', closeTxSheet);
$('txOverlay').addEventListener('click', (e) => { if (e.target.id === 'txOverlay') closeTxSheet(); });

$('txSave').addEventListener('click', async () => {
  const amount = Number($('fAmount').value);
  const accountId = $('fAccount').value;
  const date = $('fDate').value;
  const note = $('fNote').value.trim();

  if (!amount || amount <= 0){ toast('Isi jumlah yang valid'); return; }
  if (!accountId){ toast('Pilih akun'); return; }
  if (!date){ toast('Isi tanggal'); return; }

  const payload = { type: txType, amount, account_id: accountId, date, note, user_id: session.user.id };
  if (txType === 'transfer'){
    const toId = $('fToAccount').value;
    if (!toId || toId === accountId){ toast('Pilih akun tujuan yang berbeda'); return; }
    payload.to_account_id = toId;
    payload.category = 'Transfer';
    payload.goal_id = null;
  } else {
    payload.category = $('fCategory').value;
    payload.to_account_id = null;
    payload.goal_id = (txType === 'pengeluaran' && $('fGoal').value) ? $('fGoal').value : null;
  }

  let error;
  if (editingTxId) ({ error } = await supa.from('transactions').update(payload).eq('id', editingTxId));
  else ({ error } = await supa.from('transactions').insert(payload));
  if (error){ toast('Gagal simpan: ' + error.message); return; }

  closeTxSheet();
  toast('Tersimpan');
  loadAll();
});

$('txDelete').addEventListener('click', async () => {
  if (!editingTxId) return;
  if (!confirm('Hapus transaksi ini?')) return;
  const { error } = await supa.from('transactions').delete().eq('id', editingTxId);
  if (error){ toast('Gagal hapus: ' + error.message); return; }
  closeTxSheet();
  toast('Dihapus');
  loadAll();
});

/* ================================================================
   Sheet: Akun
   ================================================================ */

function openAcctSheet(a){
  editingAcctId = a ? a.id : null;
  $('acctSheetTitle').textContent = a ? 'Edit Akun' : 'Tambah Akun';
  $('acctDelete').classList.toggle('hidden', !a);
  $('aName').value = a ? a.name : '';
  $('aType').value = a ? a.type : 'cash';
  $('aBalance').value = a ? a.initial_balance : '';
  $('acctOverlay').classList.add('show');
}
function closeAcctSheet(){ $('acctOverlay').classList.remove('show'); editingAcctId = null; }
$('acctCancel').addEventListener('click', closeAcctSheet);
$('acctOverlay').addEventListener('click', (e) => { if (e.target.id === 'acctOverlay') closeAcctSheet(); });

$('acctSave').addEventListener('click', async () => {
  const name = $('aName').value.trim();
  const type = $('aType').value;
  const initial_balance = Number($('aBalance').value) || 0;
  if (!name){ toast('Isi nama akun'); return; }

  const payload = { name, type, initial_balance, user_id: session.user.id };
  let error;
  if (editingAcctId) ({ error } = await supa.from('accounts').update(payload).eq('id', editingAcctId));
  else ({ error } = await supa.from('accounts').insert(payload));
  if (error){ toast('Gagal simpan: ' + error.message); return; }

  closeAcctSheet();
  toast('Tersimpan');
  loadAll();
});

$('acctDelete').addEventListener('click', async () => {
  if (!editingAcctId) return;
  if (!confirm('Hapus akun ini? Semua transaksi di akun ini ikut terhapus.')) return;
  const { error } = await supa.from('accounts').delete().eq('id', editingAcctId);
  if (error){ toast('Gagal hapus: ' + error.message); return; }
  closeAcctSheet();
  toast('Dihapus');
  loadAll();
});

/* ================================================================
   Sheet: Anggaran
   ================================================================ */

function fillBudgetCategorySelect(currentCategory){
  const sel = $('bCategory');
  sel.innerHTML = '';
  const used = new Set(budgets.map((b) => b.category).filter((c) => c !== currentCategory));
  for (const c of DEFAULT_CATEGORIES.pengeluaran){
    if (used.has(c)) continue;
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    sel.appendChild(opt);
  }
}

function openBudgetSheet(b){
  editingBudgetId = b ? b.id : null;
  $('budgetSheetTitle').textContent = b ? 'Edit Anggaran' : 'Tambah Anggaran';
  $('budgetDelete').classList.toggle('hidden', !b);
  fillBudgetCategorySelect(b ? b.category : null);
  if (b) $('bCategory').value = b.category;
  $('bLimit').value = b ? b.limit_amount : '';
  $('budgetOverlay').classList.add('show');
}
function closeBudgetSheet(){ $('budgetOverlay').classList.remove('show'); editingBudgetId = null; }
$('budgetCancel').addEventListener('click', closeBudgetSheet);
$('budgetOverlay').addEventListener('click', (e) => { if (e.target.id === 'budgetOverlay') closeBudgetSheet(); });

$('budgetSave').addEventListener('click', async () => {
  const category = $('bCategory').value;
  const limit_amount = Number($('bLimit').value);
  if (!category){ toast('Pilih kategori'); return; }
  if (!limit_amount || limit_amount <= 0){ toast('Isi limit yang valid'); return; }

  const payload = { category, limit_amount, user_id: session.user.id };
  let error;
  if (editingBudgetId) ({ error } = await supa.from('budgets').update(payload).eq('id', editingBudgetId));
  else ({ error } = await supa.from('budgets').insert(payload));
  if (error){ toast('Gagal simpan: ' + error.message); return; }

  closeBudgetSheet();
  toast('Tersimpan');
  loadAll();
});

$('budgetDelete').addEventListener('click', async () => {
  if (!editingBudgetId) return;
  if (!confirm('Hapus anggaran ini?')) return;
  const { error } = await supa.from('budgets').delete().eq('id', editingBudgetId);
  if (error){ toast('Gagal hapus: ' + error.message); return; }
  closeBudgetSheet();
  toast('Dihapus');
  loadAll();
});

/* ================================================================
   Sheet: Tabungan
   ================================================================ */

function openGoalSheet(g){
  editingGoalId = g ? g.id : null;
  $('goalSheetTitle').textContent = g ? 'Edit Target Tabungan' : 'Tambah Target Tabungan';
  $('goalDelete').classList.toggle('hidden', !g);
  $('gName').value = g ? g.name : '';
  $('gTarget').value = g ? g.target_amount : '';
  $('gDate').value = g ? (g.target_date || '') : '';
  $('goalOverlay').classList.add('show');
}
function closeGoalSheet(){ $('goalOverlay').classList.remove('show'); editingGoalId = null; }
$('goalCancel').addEventListener('click', closeGoalSheet);
$('goalOverlay').addEventListener('click', (e) => { if (e.target.id === 'goalOverlay') closeGoalSheet(); });

$('goalSave').addEventListener('click', async () => {
  const name = $('gName').value.trim();
  const target_amount = Number($('gTarget').value);
  const target_date = $('gDate').value || null;
  if (!name){ toast('Isi nama target'); return; }
  if (!target_amount || target_amount <= 0){ toast('Isi target jumlah yang valid'); return; }

  const payload = { name, target_amount, target_date, user_id: session.user.id };
  let error;
  if (editingGoalId) ({ error } = await supa.from('goals').update(payload).eq('id', editingGoalId));
  else ({ error } = await supa.from('goals').insert(payload));
  if (error){ toast('Gagal simpan: ' + error.message); return; }

  closeGoalSheet();
  toast('Tersimpan');
  loadAll();
});

$('goalDelete').addEventListener('click', async () => {
  if (!editingGoalId) return;
  if (!confirm('Hapus target tabungan ini? Transaksi yang terkait tidak ikut terhapus, hanya kaitannya saja.')) return;
  const { error } = await supa.from('goals').delete().eq('id', editingGoalId);
  if (error){ toast('Gagal hapus: ' + error.message); return; }
  closeGoalSheet();
  toast('Dihapus');
  loadAll();
});

/* ================================================================
   Sheet: Transaksi Berulang
   ================================================================ */

let recurType = 'pengeluaran';

function fillRecurCategorySelect(){
  const sel = $('rCategory');
  const prev = sel.value;
  sel.innerHTML = '';
  for (const c of DEFAULT_CATEGORIES[recurType]){
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    sel.appendChild(opt);
  }
  if (DEFAULT_CATEGORIES[recurType].includes(prev)) sel.value = prev;
}
function setRecurType(type){
  recurType = type;
  $('rTypePengeluaran').classList.toggle('active', type === 'pengeluaran');
  $('rTypePemasukan').classList.toggle('active', type === 'pemasukan');
  fillRecurCategorySelect();
}
$('rTypePengeluaran').addEventListener('click', () => setRecurType('pengeluaran'));
$('rTypePemasukan').addEventListener('click', () => setRecurType('pemasukan'));

$('btnAddRecurring').addEventListener('click', () => openRecurSheet(null));

function openRecurSheet(r){
  if (!accounts.length){ toast('Tambah akun dulu'); return; }
  editingRecurId = r ? r.id : null;
  $('recurSheetTitle').textContent = r ? 'Edit Transaksi Berulang' : 'Tambah Transaksi Berulang';
  $('recurDelete').classList.toggle('hidden', !r);
  fillAccountSelect($('rAccount'));
  setRecurType(r ? r.type : 'pengeluaran');
  $('rAmount').value = r ? r.amount : '';
  $('rAccount').value = r ? r.account_id : accounts[0].id;
  $('rCategory').value = r ? r.category : DEFAULT_CATEGORIES[recurType][0];
  $('rDay').value = r ? r.day_of_month : '';
  $('rNote').value = r ? (r.note || '') : '';
  $('rActive').checked = r ? !!r.active : true;
  $('recurOverlay').classList.add('show');
}
function closeRecurSheet(){ $('recurOverlay').classList.remove('show'); editingRecurId = null; }
$('recurCancel').addEventListener('click', closeRecurSheet);
$('recurOverlay').addEventListener('click', (e) => { if (e.target.id === 'recurOverlay') closeRecurSheet(); });

$('recurSave').addEventListener('click', async () => {
  const amount = Number($('rAmount').value);
  const account_id = $('rAccount').value;
  const category = $('rCategory').value;
  const day_of_month = Number($('rDay').value);
  const note = $('rNote').value.trim();
  const active = $('rActive').checked;

  if (!amount || amount <= 0){ toast('Isi jumlah yang valid'); return; }
  if (!account_id){ toast('Pilih akun'); return; }
  if (!day_of_month || day_of_month < 1 || day_of_month > 28){ toast('Tanggal harus antara 1-28'); return; }

  const payload = { type: recurType, amount, account_id, category, day_of_month, note, active, user_id: session.user.id };
  let error;
  if (editingRecurId) ({ error } = await supa.from('recurring').update(payload).eq('id', editingRecurId));
  else ({ error } = await supa.from('recurring').insert(payload));
  if (error){ toast('Gagal simpan: ' + error.message); return; }

  closeRecurSheet();
  toast('Tersimpan');
  loadAll();
});

$('recurDelete').addEventListener('click', async () => {
  if (!editingRecurId) return;
  if (!confirm('Hapus transaksi berulang ini?')) return;
  const { error } = await supa.from('recurring').delete().eq('id', editingRecurId);
  if (error){ toast('Gagal hapus: ' + error.message); return; }
  closeRecurSheet();
  toast('Dihapus');
  loadAll();
});

/* ---------------- FAB ---------------- */

$('btnFab').addEventListener('click', () => {
  if (currentTab === 'anggaran') openBudgetSheet(null);
  else if (currentTab === 'tabungan') openGoalSheet(null);
  else if (currentTab === 'akun') openAcctSheet(null);
  else openTxSheet(null);
});
$('btnEmptyAddExpense').addEventListener('click', () => openTxSheet(null));

/* ---------------- Boot ---------------- */

setTxType('pengeluaran');
setRecurType('pengeluaran');
setTab('beranda');
initAuth();

if ('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
