/**
 * TPE Dashboard v2.0 — Main App
 * Warm-toned card layout, real-time polling, graceful error handling.
 */
import { DashboardAPI } from './api.js';

const $ = (s) => document.querySelector(s);
const html = (el, str) => { el.innerHTML = str; return el; };

function skeleton(kind = 'text', n = 1) {
  if (kind === 'number') return '<div class="skeleton skeleton-number"></div>';
  if (kind === 'block') return '<div class="skeleton skeleton-block"></div>';
  return Array(n).fill('<div class="skeleton skeleton-text"></div>').join('') +
    '<div class="skeleton skeleton-text short"></div>';
}

function errorCard(msg, retryLabel, retryFn) {
  return `<div class="error-state">
    <div class="error-icon">—</div>
    <div class="error-msg">${msg}</div>
    <button class="error-retry">${retryLabel || '重新載入'}</button>
  </div>`;
}

// ═══════════════════ HERO BANNER ═══════════════════

function renderHero(lunarData) {
  const now = new Date();
  const ds = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const wk = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
  $('#hero-solar').textContent = ds;
  $('#hero-weekday').textContent = `週${wk}`;
  $('#hero-lunar').textContent = lunarData?.lunar_date || '';
  $('#hero-term').textContent = lunarData?.solar_term || '';
  const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  $('#update-badge').textContent = `${ts} 已更新`;
}

// ═══════════════════ WEATHER ═══════════════════

function renderWeather(data, aqiData, uvData) {
  const el = $('#weather-body');
  if (!data) { html(el, errorCard('天氣資料載入失敗', '重試', initWeather)); return; }
  const t = data.temperature;
  const aqi = aqiData?.aqi || 0;
  const aqiLevel = aqiData?.level || '';
  const pm25 = aqiData?.pm25 || 0;
  const uv = uvData?.index || 0;
  const uvLevel = uvData?.level || '';
  const uvColor = uv >= 8 ? 'var(--accent-coral)' : uv >= 6 ? 'var(--accent-gold)' : uv >= 3 ? 'var(--accent-teal)' : 'var(--accent-green)';
  const aqiColor = aqi <= 50 ? 'var(--accent-green)' : aqi <= 100 ? 'var(--accent-gold)' : 'var(--accent-coral)';

  html(el, `
    <div class="weather-main">
      <div class="weather-temp-block">
        <div class="weather-temp">${t.current}<sup>°C</sup></div>
        <div class="weather-condition">${data.condition}</div>
        <div class="weather-feel">體感 ${t.feel}°C · 濕度 ${data.humidity}% · 風速 ${data.wind} km/h</div>
      </div>
      <div style="text-align:right;font-size:3.5rem;opacity:0.7">${weatherEmoji(data.condition)}</div>
    </div>
    <div class="weather-grid">
      <div class="weather-stat"><div class="ws-label">今日降雨</div><div class="ws-value">${data.rain_prob_today}<span class="ws-unit">%</span></div></div>
      <div class="weather-stat warm"><div class="ws-label">明日降雨</div><div class="ws-value">${data.rain_prob_tomorrow}<span class="ws-unit">%</span></div></div>
      <div class="weather-stat gold"><div class="ws-label">最高 · 最低</div><div class="ws-value">${t.max}<span class="ws-unit">°</span> · ${t.min}<span class="ws-unit">°</span></div></div>
      <div class="weather-stat green"><div class="ws-label">AQI ${aqi} · PM2.5 ${pm25}</div><div class="ws-value" style="font-size:var(--font-size-lg);color:${aqiColor}">${aqiLevel}</div></div>
    </div>
    <div style="margin-top:12px;padding:12px 16px;background:var(--accent-gold-light);border-radius:12px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:var(--font-size-xs);color:var(--text-dim)">紫外線指數</span>
      <span style="font-family:var(--font-display);font-size:var(--font-size-xl);font-weight:700;color:${uvColor}">UV ${uv} <span style="font-size:var(--font-size-sm);font-weight:500">${uvLevel}</span></span>
    </div>
    ${aqiData?.advice ? `<div class="aqi-advice">${aqiData.advice}</div>` : ''}
  `);
}

function weatherEmoji(cond) {
  if (!cond) return '☁️';
  if (cond.includes('晴')) return '☀️';
  if (cond.includes('陰')) return '☁️';
  if (cond.includes('雨') || cond.includes('雷')) return '🌧️';
  if (cond.includes('雲')) return '⛅';
  return '🌤️';
}

// ═══════════════════ AQI / UV ═══════════════════

function renderAqi(aqiData, uvData) {
  const el = $('#aqi-body');
  if (!aqiData) { html(el, errorCard('空氣品質資料載入失敗', '重試', initAqi)); return; }

  const aqi = aqiData.aqi || 0;
  const level = aqiData.level || '';
  const aqiColor = aqi <= 50 ? 'var(--accent-green)' : aqi <= 100 ? 'var(--accent-gold)' : aqi <= 150 ? 'var(--accent-coral)' : 'var(--status-danger)';

  const uv = uvData?.index || 0;
  const uvLevel = uvData?.level || '';
  const uvColor = uv >= 8 ? 'var(--accent-coral)' : uv >= 6 ? 'var(--accent-gold)' : uv >= 3 ? 'var(--accent-teal)' : 'var(--accent-green)';

  html(el, `
    <div class="aqi-display">
      <div class="aqi-number" style="color:${aqiColor}">${aqi}</div>
      <div class="aqi-label" style="color:${aqiColor}">${level}</div>
    </div>
    <div class="aqi-detail-row"><span class="aqi-dr-label">PM2.5</span><span class="aqi-dr-value">${aqiData.pm25 || '—'} <span style="font-size:10px;color:var(--text-dim)">μg/m³</span></span></div>
    <div class="aqi-detail-row"><span class="aqi-dr-label">PM10</span><span class="aqi-dr-value">${aqiData.pm10 || '—'} <span style="font-size:10px;color:var(--text-dim)">μg/m³</span></span></div>
    <div class="aqi-detail-row"><span class="aqi-dr-label">臭氧 O₃</span><span class="aqi-dr-value">${aqiData.o3 || '—'} <span style="font-size:10px;color:var(--text-dim)">ppb</span></span></div>
    <div style="margin-top:14px;padding:12px 14px;background:var(--accent-gold-light);border-radius:12px;text-align:center">
      <div style="font-size:var(--font-size-xs);color:var(--text-dim);margin-bottom:4px">紫外線指數</div>
      <div style="font-family:var(--font-display);font-size:var(--font-size-xl);font-weight:700;color:${uvColor}">UV ${uv}<span style="font-size:var(--font-size-sm);font-weight:500"> ${uvLevel}</span></div>
    </div>
    ${aqiData.advice ? `<div class="aqi-advice">${aqiData.advice}</div>` : ''}
  `);
}

// ═══════════════════ EARTHQUAKE ═══════════════════

function renderEarthquake(data) {
  const el = $('#eq-body');
  if (!data || !data.magnitude) {
    html(el, '<div style="text-align:center;padding:20px;color:var(--text-dim);font-size:var(--font-size-sm)">近期無有感地震</div>');
    return;
  }
  const time = data.time ? data.time.split('T')[1]?.substring(0, 5) || data.time.substring(11, 16) : '';
  const date = data.time ? data.time.substring(5, 10) : '';

  html(el, `
    <div class="quake-magnitude-row">
      <span class="quake-mag-number">${data.magnitude}</span>
      <span class="quake-mag-unit">M</span>
    </div>
    <div class="quake-location">${data.location}</div>
    <div class="quake-detail-list">
      <div class="quake-row"><span class="qr-label">時間</span><span class="qr-value">${date} ${time}</span></div>
      <div class="quake-row"><span class="qr-label">深度</span><span class="qr-value">${data.depth} km</span></div>
      <div class="quake-row"><span class="qr-label">來源</span><span class="qr-value" style="font-size:var(--font-size-xs)">CWA 中央氣象署</span></div>
    </div>
    <div class="quake-intensity-badge">
      <span class="intensity-label">台北市體感震度</span>
      <span class="intensity-value">${data.tpe_intensity || '—'} <span style="font-size:var(--font-size-xs);color:var(--text-dim)">級</span></span>
    </div>
  `);

  if (data.magnitude >= 5) showAlert(`規模 ${data.magnitude} 地震 · ${data.location}`, `${date} ${time} · 震源深度 ${data.depth} km`);
}

function showAlert(title, desc) {
  const banner = $('#alert-banner');
  if (!banner) return;
  banner.classList.add('active');
  $('#alert-title').textContent = title;
  $('#alert-desc').textContent = desc;
}

// ═══════════════════ WEEKLY FORECAST ═══════════════════

function renderWeekly(data) {
  const el = $('#weekly-body');
  if (!data?.days?.length) { html(el, errorCard('預報資料載入失敗', '重試', initWeekly)); return; }
  const todayIdx = new Date().getDay();
  html(el, `<div class="weekly-forecast">${data.days.map((d, i) => {
    const isToday = d.day === ['週日','週一','週二','週三','週四','週五','週六'][todayIdx];
    const wemoji = d.icon === 'sunny' ? '☀️' : d.icon === 'rain' ? '🌧️' : d.icon === 'cloudy' ? '☁️' : '⛅';
    return `<div class="weekly-day${isToday ? ' today' : ''}">
      <div class="wd-date">${d.day} ${d.date}</div>
      <div class="wd-icon">${wemoji}</div>
      <div class="wd-temp">${d.temp_high}° ${d.temp_low}°</div>
      <div class="wd-rain">${d.rain > 0 ? `☂ ${d.rain}%` : ''}</div>
    </div>`;
  }).join('')}</div>`);
}

// ═══════════════════ YOUBIKE ═══════════════════

function renderYoubike(data) {
  const el = $('#youbike-body');
  if (!data?.length) { html(el, errorCard('YouBike 資料載入失敗', '重試', initYoubike)); return; }
  html(el, `<div class="ybike-list">${data.slice(0, 6).map(s => `
    <div class="ybike-item">
      <div class="ybike-bar-wrap">
        <div class="ybike-bar-header">
          <span class="ybike-station">${s.station}</span>
          <span class="ybike-tag ${s.status}">${s.status === 'hot' ? '搶車中' : s.status === 'plenty' ? '充足' : '正常'}</span>
        </div>
        <div class="ybike-track"><div class="ybike-fill" style="width:${Math.min(100, (s.bikes / Math.max(1, s.total)) * 100)}%"></div></div>
      </div>
      <span class="ybike-count">${s.bikes}</span>
    </div>`).join('')}</div>`);
}

// ═══════════════════ HIGHWAY ═══════════════════

function renderHighway(data) {
  const el = $('#highway-body');
  if (!data?.length) { html(el, errorCard('路況資料載入失敗', '重試', initHighway)); return; }
  html(el, `<div class="highway-list">${data.map(h => `
    <div class="highway-item">
      <span class="hw-name">${h.road}</span>
      <span class="hw-speed ${h.condition}">${h.speed} <span style="font-size:10px;color:var(--text-dim)">km/h</span></span>
    </div>`).join('')}
    <div class="hw-legends">
      <span><span class="hw-legend-dot" style="background:var(--accent-green)"></span>80+</span>
      <span><span class="hw-legend-dot" style="background:var(--accent-gold)"></span>40-80</span>
      <span><span class="hw-legend-dot" style="background:var(--accent-coral)"></span>&lt;40</span>
    </div></div>`);
}

// ═══════════════════ PARKING ═══════════════════

function renderParking(data) {
  const el = $('#parking-body');
  if (!data) { html(el, errorCard('停車場資料載入失敗', '重試', initParking)); return; }
  const lots = data.lots || [];
  html(el, `
    <div class="parking-hero">
      <div class="parking-number">${(data.total || 0).toLocaleString()}</div>
      <div class="parking-district">${data.district || '信義區'} 剩餘汽車位</div>
    </div>
    <div class="parking-lot-list">${lots.map(l => `
      <div class="parking-lot-item">
        <span class="pl-name">${l.name}</span>
        <span class="pl-slots${(l.available || 0) < 50 ? ' low' : ''}">${(l.available || 0).toLocaleString()} 位</span>
      </div>`).join('')}</div>`);
}

// ═══════════════════ STOCK ═══════════════════

function renderStockTW(stocks) {
  const el = $('#stock-tw-body');
  if (!stocks?.length) { html(el, errorCard('股市資料載入失敗', '重試', initStock)); return; }
  const twStocks = stocks.filter(s => s.type === 'tw');
  if (!twStocks.length) { html(el, '<div style="padding:16px;color:var(--text-dim);text-align:center">台股休市中</div>'); return; }
  const main = twStocks[0];
  const chgCls = main.change_pct >= 0 ? 'up' : 'down';
  const arrow = main.change_pct >= 0 ? '▲' : '▼';
  const sign = main.change_pct >= 0 ? '+' : '';

  html(el, `
    <div class="stock-header">
      <span class="stock-value">${main.price.toLocaleString()}</span>
      <span class="stock-change ${chgCls}">${arrow} ${sign}${Math.abs(main.change_pct).toFixed(2)}%</span>
    </div>
    <div class="stock-volume">${main.name} · 成交量 ${main.change ? Math.abs(Math.round(main.change)).toLocaleString() : '—'} 張</div>
    <div class="stock-list">${twStocks.map((s, i) => {
      const cls = s.change_pct >= 0 ? 'up' : 'down';
      return `<div class="stock-item${i === 0 ? ' primary' : ''}">
        <span class="si-name">${s.name}</span>
        <span class="si-price">${s.price.toLocaleString()}</span>
        <span class="si-arrow ${cls}">${s.change_pct >= 0 ? '▲' : '▼'}</span>
        <span class="si-chg ${cls}">${s.change_pct >= 0 ? '+' : ''}${s.change_pct.toFixed(2)}%</span>
      </div>`;
    }).join('')}</div>`);
}

function renderStockUS(stocks) {
  const el = $('#stock-us-body');
  if (!stocks?.length) { html(el, errorCard('美股資料載入失敗', '重試', initStock)); return; }
  const usStocks = stocks.filter(s => s.type === 'us');
  if (!usStocks.length) { html(el, '<div style="padding:16px;color:var(--text-dim);text-align:center">美股尚未開盤</div>'); return; }
  html(el, `<div class="stock-list">${usStocks.map(s => {
    const cls = s.change_pct >= 0 ? 'up' : 'down';
    return `<div class="stock-item">
      <span class="si-name">${s.name}</span>
      <span class="si-price">${s.price.toLocaleString()}</span>
      <span class="si-arrow ${cls}">${s.change_pct >= 0 ? '▲' : '▼'}</span>
      <span class="si-chg ${cls}">${s.change_pct >= 0 ? '+' : ''}${s.change_pct.toFixed(2)}%</span>
    </div>`;
  }).join('')}</div>`);
}

// ═══════════════════ AGRICULTURE ═══════════════════

function renderAgriculture(data) {
  const el = $('#agri-body');
  if (!data) { html(el, errorCard('農產行情載入失敗', '重試', initAgriculture)); return; }

  const cats = {
    '蔬菜': data.vegetables || [],
    '水果': data.fruits || [],
    '漁貨': data.seafood || []
  };
  let active = '蔬菜';

  function table(items) {
    if (!items.length) return '<tr><td colspan="4" style="text-align:center;color:var(--text-dim);padding:16px">暫無資料</td></tr>';
    return items.slice(0, 8).map(v => {
      let chg = '';
      if (v.change_pct > 0) chg = `<span class="agri-chg up">▲ ${Math.abs(v.change_pct).toFixed(1)}%</span>`;
      else if (v.change_pct < 0) chg = `<span class="agri-chg down">▼ ${Math.abs(v.change_pct).toFixed(1)}%</span>`;
      else chg = `<span class="agri-chg flat">—</span>`;
      return `<tr><td class="agri-name">${v.name}</td><td class="agri-market">${v.market || ''}</td><td class="agri-price">$${v.price}</td><td>${chg}</td></tr>`;
    }).join('');
  }

  html(el, `
    <div class="agri-tabs">${Object.keys(cats).map(c => `<button class="agri-tab${c === active ? ' active' : ''}" data-cat="${c}">${c}</button>`).join('')}</div>
    <table class="agri-table">
      <thead><tr><th>品項</th><th>市場</th><th>均價/kg</th><th>漲跌</th></tr></thead>
      <tbody>${table(cats[active])}</tbody>
    </table>
    <div class="agri-source">${data.source || 'MOA 農業部'}${data.date ? ` · ${data.date}` : ''}${data.note ? ` · ${data.note}` : ''}</div>
  `);

  el.querySelectorAll('.agri-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      active = tab.dataset.cat;
      el.querySelectorAll('.agri-tab').forEach(t => t.classList.toggle('active', t.dataset.cat === active));
      const tbody = el.querySelector('tbody');
      if (tbody) tbody.innerHTML = table(cats[active]);
    });
  });
}

// ═══════════════════ HOLIDAYS ═══════════════════

function renderHolidays(data) {
  const el = $('#holidays-body');
  if (!data) { html(el, errorCard('假日資料載入失敗', '重試', initEducation)); return; }
  const today = new Date();
  const isMakeup = data.makeup_day?.includes('補班');
  html(el, `
    <div class="holiday-badge">
      <div class="holiday-badge-label">${isMakeup ? '今日補班' : (data.school_status || '今日正常')}</div>
    </div>
    <div class="holiday-next">
      <span class="hn-label">下個假日</span>
      <span class="hn-value">${data.next_holiday?.name || ''} ${data.next_holiday?.date?.substring(5) || ''}</span>
    </div>
    <div class="holiday-next">
      <span class="hn-label">倒數</span>
      <span class="hn-countdown">${data.next_holiday?.days || '—'} 天</span>
    </div>
    <div class="holiday-next">
      <span class="hn-label">補班提醒</span>
      <span class="hn-value" style="font-size:var(--font-size-xs)">${data.makeup_day || '本月無補班'}</span>
    </div>
    <div class="holiday-next">
      <span class="hn-label">學校行事</span>
      <span class="hn-value" style="font-size:var(--font-size-xs)">${data.school_status || '學期中'}</span>
    </div>
  `);
}

// ═══════════════════ ACTIVITIES ═══════════════════

function renderActivities(data) {
  const el = $('#activities-body');
  if (!data?.length) { html(el, '<div style="text-align:center;padding:20px;color:var(--text-dim);font-size:var(--font-size-sm)">暫無活動</div>'); return; }
  html(el, `<div class="activity-scroll">${data.map(a => `
    <div class="activity-card-item">
      <div class="ac-name">${a.name}</div>
      <div class="ac-date">${a.date}</div>
      <div class="ac-loc">${a.location || ''}</div>
      <span class="ac-tag">${a.tag || ''}</span>
    </div>`).join('')}</div>`);
}

// ═══════════════════ INIT FUNCTIONS ═══════════════════

async function initHero() {
  try {
    const lunar = await DashboardAPI.getLunar();
    renderHero(lunar);
  } catch {}
}

async function initWeather() {
  try {
    const [weather, aqi, uv] = await Promise.all([DashboardAPI.getWeather(), DashboardAPI.getAqi(), DashboardAPI.getUv()]);
    renderWeather(weather, aqi, uv);
  } catch {}
}

async function initAqi() {
  try {
    const [aqi, uv] = await Promise.all([DashboardAPI.getAqi(), DashboardAPI.getUv()]);
    renderAqi(aqi, uv);
  } catch {}
}

async function initEarthquake() {
  try {
    const eq = await DashboardAPI.getEarthquake();
    renderEarthquake(eq);
  } catch {}
}

async function initWeekly() {
  try {
    const w7d = await DashboardAPI.getWeather7d();
    renderWeekly(w7d);
  } catch {}
}

async function initYoubike() {
  try {
    const yb = await DashboardAPI.getYoubike();
    renderYoubike(yb);
  } catch {}
}

async function initHighway() {
  try {
    const hw = await DashboardAPI.getHighway();
    renderHighway(hw);
  } catch {}
}

async function initParking() {
  try {
    const pk = await DashboardAPI.getParking();
    renderParking(pk);
  } catch {}
}

async function initStock() {
  try {
    const s = await DashboardAPI.getStock();
    const stocks = s?.stocks || [];
    renderStockTW(stocks);
    renderStockUS(stocks);
  } catch {}
}

async function initAgriculture() {
  try {
    const ag = await DashboardAPI.getAgriculture();
    renderAgriculture(ag);
  } catch {}
}

async function initEducation() {
  try {
    const edu = await DashboardAPI.getEducation();
    renderHolidays(edu);
  } catch {}
}

async function initActivities() {
  try {
    const act = await DashboardAPI.getActivities();
    renderActivities(act);
  } catch {}
}

// ═══════════════════ ERROR RETRY WIRING ═══════════════════

function wireRetry(selector, initFn) {
  const el = $(selector);
  if (!el) return;
  el.addEventListener('click', (e) => {
    if (e.target.classList.contains('error-retry')) {
      initFn();
    }
  });
}

// ═══════════════════ POLLING ═══════════════════

function startPolling() {
  setInterval(async () => {
    try { renderEarthquake(await DashboardAPI.getEarthquake()); } catch {}
  }, 5 * 60 * 1000);
  setInterval(async () => {
    try { renderYoubike(await DashboardAPI.getYoubike()); } catch {}
  }, 60 * 1000);
  setInterval(async () => {
    try { renderHighway(await DashboardAPI.getHighway()); } catch {}
  }, 5 * 60 * 1000);
}

// ═══════════════════ BOOTSTRAP ═══════════════════

async function init() {
  await Promise.all([
    initHero(),
    initWeather(),
    initAqi(),
    initEarthquake(),
    initWeekly(),
    initYoubike(),
    initHighway(),
    initParking(),
    initStock(),
    initAgriculture(),
    initEducation(),
    initActivities()
  ]);

  // Wire retry buttons on error cards
  ['#weather-body', '#aqi-body', '#eq-body', '#weekly-body',
   '#youbike-body', '#highway-body', '#parking-body',
   '#stock-tw-body', '#stock-us-body', '#agri-body',
   '#holidays-body'].forEach(s => wireRetry(s, init));

  startPolling();
  initTabs();
  initTools();
}

function initTabs() {}

// ═══════════════════ TOOL: 停車位查詢 ═══════════════════

function initTools() {
  const pkBtn = $('#pk-search');
  if (pkBtn) pkBtn.addEventListener('click', searchParking);

  const jdBtn = $('#jd-search');
  if (jdBtn) jdBtn.addEventListener('click', searchJudicial);

  const reBtn = $('#re-search');
  if (reBtn) reBtn.addEventListener('click', searchRealEstate);

  const sdAddrBtn = $('#sd-search-address');
  if (sdAddrBtn) sdAddrBtn.addEventListener('click', () => searchSchoolDist('address'));

  const sdSchBtn = $('#sd-search-school');
  if (sdSchBtn) sdSchBtn.addEventListener('click', () => searchSchoolDist('school'));

  const sdDistrict = $('#sd-district');
  if (sdDistrict) sdDistrict.addEventListener('change', updateVillages);

  window.__switchSchoolMode = switchSchoolMode;
}

function switchSchoolMode(mode) {
  document.querySelectorAll('#tool-schooldist [data-mode]').forEach(b => b.classList.remove('active'));
  document.querySelector(`#tool-schooldist [data-mode="${mode}"]`)?.classList.add('active');

  const addrForm = document.getElementById('sd-form-address');
  const schForm = document.getElementById('sd-form-school');
  if (addrForm) addrForm.style.display = mode === 'address' ? '' : 'none';
  if (schForm) schForm.style.display = mode === 'school' ? '' : 'none';

  const el = $('#sd-results');
  if (el) el.innerHTML = '<div class="results-empty">請選擇查詢模式：地址查學校 或 學校查學區</div>';
}

function updateVillages() {
  const district = $('#sd-district').value;
  const sel = $('#sd-village');
  if (!sel) return;
  const villages = SCHOOL_DB.villages[district] || [];
  sel.innerHTML = '<option value="">全部</option>' + villages.map(v => `<option value="${v}">${v}</option>`).join('');
}

const SCHOOL_DB = {
  villages: {
    '信義區': ['興雅里','西村里','正和里','興隆里','中興里','新仁里','安康里','黎順里','黎平里','黎忠里','黎安里','景新里','惠安里','三張里','三犁里','六合里','泰和里','景聯里','景勤里','雙和里','嘉興里','大道里','大仁里','松友里','松光里','中坡里','長春里','四育里','四維里','永春里','永吉里','五常里','雅祥里','敦厚里','廣居里','富台里','國業里'],
    '大安區': ['德安里','仁慈里','法治里','龍圖里','新龍里','龍陣里','龍泉里','古風里','古莊里','龍安里','錦華里','福住里','永康里','光明里','錦泰里','大學里','學府里','龍生里','龍坡里','民輝里','民炤里','昌隆里','誠安里','義村里','和安里','建安里','群英里','群賢里','臥龍里','虎嘯里','敦安里','仁愛里','光信里','車層里','通化里','通安里','臨江里','法治里','全安里'],
    '中山區': ['正義里','正得里','民安里','康樂里','中山里','聚盛里','集英里','圓山里','晴光里','恆安里','江山里','新生里','中庄里','行政里','行仁里','行孝里','下埤里','江寧里','松江里','朱園里','朱馥里','龍洲里','金泰里','永安里','大佳里','新喜里','新庄里','新福里','劍潭里','大直里','成功里','北安里'],
    '中正區': ['水源里','富水里','文盛里','林興里','河堤里','頂東里','網溪里','板溪里','螢圃里','螢雪里','永功里','永昌里','龍興里','忠勤里','廈安里','愛國里','南門里','龍光里','南福里','新營里','建國里','光復里','黎明里','梅花里','幸福里','幸市里','東門里','文北里','文祥里','三愛里'],
    '松山區': ['莊敬里','東榮里','介壽里','三民里','富錦里','新益里','富泰里','新東里','自強里','鵬程里','安平里','吉祥里','精忠里','東光里','龍田里','東昌里','東勢里','中華里','民有里','民福里','松基里','復勢里','復建里','中正里','中崙里','美仁里','吉仁里','敦化里','福成里','慈祐里'],
    '內湖區': ['西湖里','西康里','西安里','港墘里','港富里','港都里','港華里','麗山里','瑞光里','瑞陽里','紫雲里','紫星里','紫陽里','內湖里','內溝里','清白里','碧山里','大湖里','秀湖里','金龍里','金瑞里','湖濱里','湖興里','寶湖里','五分里','東湖里','樂康里','安湖里','安泰里','行善里','週美里','石潭里','蘆洲里'],
    '士林區': ['仁勇里','義信里','福林里','福德里','舊佳里','福佳里','後港里','福中里','前港里','百齡里','承德里','福華里','明勝里','福順里','富光里','葫蘆里','葫東里','社子里','社新里','社園里','永倫里','福安里','富洲里','岩山里','名山里','德行里','德華里','聖山里','忠誠里','芝山里','東山里','三玉里','蘭雅里','蘭興里','天福里','天祿里','天壽里','天山里','天玉里','天母里','翠山里','臨溪里','陽明里','青山里','平等里','溪山里'],
    '北投區': ['建民里','文林里','石牌里','福興里','榮光里','榮華里','裕民里','振華里','永和里','永欣里','永明里','東華里','吉利里','吉慶里','尊賢里','立賢里','立農里','洲美里','八仙里','關渡里','一德里','桃源里','稻香里','豐年里','文化里','中庸里','秀山里','開明里','智仁里','溫泉里','林泉里','長安里','中心里','奇岩里','清江里','中央里','大同里'],
    '南港區': ['南港里','中南里','新富里','三重里','東新里','東明里','西新里','玉成里','合成里','成福里','聯成里','萬福里','鴻福里','百福里','九如里','中研里','舊莊里','仁福里'],
    '文山區': ['景美里','景行里','景東里','景慶里','景仁里','景華里','萬有里','萬祥里','萬隆里','萬年里','萬和里','萬盛里','興豐里','興光里','興家里','興得里','興業里','興安里','興福里','興旺里','興泰里','興昌里','試院里','華興里','明義里','明興里','木柵里','木新里','順興里','忠順里','樟林里','樟新里','樟腳里','老泉里','指南里','萬興里','博嘉里','政大里'],
    '萬華區': ['福星里','萬壽里','西門里','新起里','菜園里','富民里','福音里','仁德里','青山里','富福里','糖廍里','雙園里','頂碩里','和平里','綠堤里','華江里','柳鄉里','日善里','和德里','忠德里','孝德里','錦德里','銘德里','榮德里','保德里','壽德里','興德里','日祥里','忠貞里','新忠里','新和里','新安里','凌霄里','騰雲里'],
    '大同區': ['玉泉里','建明里','建功里','建泰里','永樂里','朝陽里','星明里','光能里','大有里','延平里','南芳里','民權里','景星里','隆和里','國順里','國慶里','重慶里','保安里','至聖里','斯文里','揚雅里','蓬萊里','雙連里','老師里']
  },
  schools: {
    '信義區': {
      elementary: [
        { name:'興雅國小', area:'信義計畫區', villages:['興雅里','西村里','正和里'], quota:'額滿' },
        { name:'光復國小', area:'光復南路', villages:['正和里','興隆里','中興里'], quota:'正常' },
        { name:'三興國小', area:'三張犁', villages:['三張里','三犁里','六合里'], quota:'正常' },
        { name:'信義國小', area:'信義路五段', villages:['安康里','黎順里','黎平里'], quota:'額滿' },
        { name:'吳興國小', area:'吳興街', villages:['惠安里','景新里','黎安里'], quota:'正常' },
        { name:'福德國小', area:'福德街', villages:['松友里','松光里','中坡里'], quota:'正常' },
        { name:'永春國小', area:'永春', villages:['永春里','永吉里','五常里'], quota:'正常' },
        { name:'永吉國小', area:'永吉路', villages:['永吉里','敦厚里','雅祥里'], quota:'正常' },
        { name:'博愛國小', area:'松仁路/信義', villages:['安康里','泰和里'], quota:'額滿' },
      ],
      junior: [
        { name:'興雅國中', area:'信義計畫區', villages:['興雅里','西村里','正和里','興隆里','中興里'], quota:'正常' },
        { name:'信義國中', area:'信義路五段', villages:['安康里','黎順里','黎平里','黎忠里','景新里'], quota:'額滿' },
        { name:'瑠公國中', area:'吳興街', villages:['惠安里','景聯里','景勤里','黎安里'], quota:'正常' },
        { name:'永春國中', area:'永春', villages:['永春里','永吉里','五常里','長春里'], quota:'正常' },
        { name:'永吉國中', area:'永吉路', villages:['永吉里','敦厚里','雅祥里','富台里'], quota:'正常' },
      ]
    },
    '大安區': {
      elementary: [
        { name:'仁愛國小', area:'仁愛路', villages:['仁愛里','光信里','車層里'], quota:'額滿' },
        { name:'國北教大實小', area:'和平東路/敦南', villages:['臥龍里','虎嘯里','群英里'], quota:'額滿' },
        { name:'建安國小', area:'建國南路', villages:['建安里','群英里','群賢里'], quota:'正常' },
        { name:'大安國小', area:'大安森林公園', villages:['民炤里','民輝里','龍生里'], quota:'正常' },
        { name:'幸安國小', area:'幸安/新生', villages:['民炤里','誠安里','義村里'], quota:'正常' },
        { name:'龍安國小', area:'龍安/新生南路', villages:['龍安里','錦華里','龍泉里'], quota:'額滿' },
        { name:'古亭國小', area:'古亭/羅斯福路', villages:['古風里','古莊里','龍泉里'], quota:'正常' },
        { name:'銘傳國小', area:'公館/舟山路', villages:['大學里','學府里','水源里'], quota:'正常' },
      ],
      junior: [
        { name:'大安國中', area:'大安森林公園', villages:['民炤里','民輝里','龍生里','龍坡里'], quota:'正常' },
        { name:'仁愛國中', area:'仁愛路', villages:['仁愛里','光信里','德安里','敦安里'], quota:'額滿' },
        { name:'金華國中', area:'金華街/永康', villages:['永康里','光明里','錦泰里','福住里'], quota:'額滿' },
        { name:'龍門國中', area:'龍安/和平', villages:['龍安里','錦華里','龍泉里','古風里'], quota:'正常' },
        { name:'懷生國中', area:'懷生/復興', villages:['誠安里','昌隆里','義村里','和安里'], quota:'正常' },
      ]
    },
    '中山區': {
      elementary: [
        { name:'長安國小', area:'長安東路', villages:['正義里','正得里','民安里'], quota:'正常' },
        { name:'吉林國小', area:'吉林路', villages:['中庄里','行政里','新生里'], quota:'正常' },
        { name:'中山國小', area:'中山北路', villages:['集英里','圓山里','晴光里'], quota:'正常' },
        { name:'大直國小', area:'大直', villages:['大直里','永安里','成功里'], quota:'正常' },
        { name:'濱江國小', area:'濱江/大直', villages:['金泰里','成功里'], quota:'額滿' },
        { name:'永安國小', area:'大直/明水路', villages:['永安里','大直里','北安里'], quota:'正常' },
      ],
      junior: [
        { name:'大同國中 (中山)', area:'中山/大同交界', villages:['集英里','圓山里','晴光里'], quota:'正常' },
        { name:'長安國中', area:'長安東路', villages:['正義里','中庄里','行政里'], quota:'正常' },
        { name:'北安國中', area:'大直', villages:['大直里','永安里','成功里','北安里'], quota:'正常' },
        { name:'濱江國中', area:'濱江', villages:['金泰里','成功里','下埤里'], quota:'正常' },
      ]
    },
    '中正區': {
      elementary: [
        { name:'國語實小', area:'南海路', villages:['龍光里','南門里','南福里'], quota:'額滿' },
        { name:'北市大附小', area:'愛國西路', villages:['建國里','光復里','黎明里'], quota:'額滿' },
        { name:'東門國小', area:'東門/仁愛', villages:['東門里','文北里','文祥里'], quota:'正常' },
        { name:'螢橋國小', area:'螢橋/廈門街', villages:['螢圃里','螢雪里','永功里'], quota:'正常' },
        { name:'忠義國小', area:'中華路/南機場', villages:['永昌里','忠勤里','龍興里'], quota:'正常' },
      ],
      junior: [
        { name:'中正國中', area:'中正紀念堂', villages:['東門里','文北里','南門里','龍光里'], quota:'額滿' },
        { name:'螢橋國中', area:'螢橋', villages:['螢圃里','螢雪里','永功里','永昌里'], quota:'正常' },
        { name:'古亭國中', area:'古亭', villages:['水源里','富水里','文盛里'], quota:'正常' },
        { name:'南門國中', area:'南門/植物園', villages:['南門里','龍光里','南福里','愛國里'], quota:'正常' },
      ]
    },
    '松山區': {
      elementary: [
        { name:'敦化國小', area:'敦化北路', villages:['敦化里','福成里','精忠里'], quota:'額滿' },
        { name:'民生國小', area:'民生社區', villages:['莊敬里','東榮里','三民里'], quota:'額滿' },
        { name:'民權國小', area:'民權東路/民生', villages:['富錦里','新益里','富泰里'], quota:'正常' },
        { name:'松山國小', area:'松山車站', villages:['慈祐里','自強里','鵬程里'], quota:'正常' },
        { name:'西松國小', area:'西松/南京東路', villages:['安平里','吉祥里','東光里'], quota:'正常' },
      ],
      junior: [
        { name:'敦化國中', area:'敦化北路', villages:['敦化里','福成里','精忠里','中正里'], quota:'額滿' },
        { name:'民生國中', area:'民生社區', villages:['莊敬里','東榮里','三民里','富錦里'], quota:'額滿' },
        { name:'介壽國中', area:'介壽/光復', villages:['介壽里','東勢里','中華里','中崙里'], quota:'正常' },
        { name:'西松國中', area:'西松', villages:['安平里','吉祥里','東光里','龍田里'], quota:'正常' },
      ]
    }
  }
};

async function searchSchoolDist(mode) {
  const el = $('#sd-results');
  if (mode === 'address') {
    await searchByAddress(el);
  } else {
    await searchBySchool(el);
  }
}

async function searchByAddress(el) {
  const district = $('#sd-district').value;
  const village = $('#sd-village').value;
  const address = ($('#sd-address').value || '').trim();
  if (!district) { el.innerHTML = '<div class="results-empty">請選擇行政區</div>'; return; }

  const distSchools = SCHOOL_DB.schools[district];
  if (!distSchools) { el.innerHTML = '<div class="results-empty">該行政區尚無學區資料</div>'; return; }

  let elemResults = distSchools.elementary || [];
  let jrResults = distSchools.junior || [];

  if (village) {
    elemResults = elemResults.filter(s => (s.villages || []).includes(village));
    jrResults = jrResults.filter(s => (s.villages || []).includes(village));
  }
  if (address) {
    const q = address.toLowerCase();
    elemResults = elemResults.filter(s => (s.area || '').includes(address) || (s.name || '').includes(address));
  }

  const allSchools = [
    ...elemResults.map(s => ({ ...s, level: '國民小學' })),
    ...jrResults.map(s => ({ ...s, level: '國民中學' }))
  ];

  if (!allSchools.length) {
    el.innerHTML = `<div class="results-empty">未找到 ${district}${village ? village : ''} 的學區資料<br><span style="font-size:10px;color:var(--text-dim)">請嘗試更精確的里名或路段</span></div>`;
    return;
  }

  el.innerHTML = `<div class="results-header"><span>${district}${village ? ' ' + village : ''} — 找到 <span class="results-count">${allSchools.length}</span> 所學校</span></div>
    <div class="result-cards">${allSchools.map(s => `
      <div class="result-card-item">
        <div class="rc-title">${s.name}</div>
        <div class="rc-meta"><span>${s.level}</span><span>${s.area || district}</span><span class="tag ${s.quota === '額滿' ? 'tag-coral' : 'tag-green'}">${s.quota || '正常'}</span></div>
        ${s.villages ? `<div style="font-size:var(--font-size-xs);color:var(--text-dim);margin-top:6px">學區範圍：${s.villages.join('、')}</div>` : ''}
      </div>`).join('')}</div>
    <div style="font-size:10px;color:var(--text-dim);text-align:center;padding:12px">資料來源：台北市政府教育局學區劃分公告 · 僅供參考，實際學區以當年公告為準</div>`;
}

async function searchBySchool(el) {
  const level = $('#sd-level').value;
  const district = $('#sd-district2').value;
  const nameQ = ($('#sd-school-name').value || '').trim();

  let results = [];
  for (const [d, data] of Object.entries(SCHOOL_DB.schools)) {
    if (district && d !== district) continue;
    const schools = [];
    if (level !== 'junior') schools.push(...(data.elementary || []).map(s => ({ ...s, level: '國民小學', district: d })));
    if (level !== 'elementary') schools.push(...(data.junior || []).map(s => ({ ...s, level: '國民中學', district: d })));
    results.push(...schools);
  }

  if (nameQ) {
    results = results.filter(s => s.name.includes(nameQ) || (s.area || '').includes(nameQ));
  }

  if (!results.length) {
    el.innerHTML = '<div class="results-empty">未找到符合條件的學校，請更換關鍵字</div>';
    return;
  }

  el.innerHTML = `<div class="results-header"><span>找到 <span class="results-count">${results.length}</span> 所學校</span></div>
    <div class="result-cards">${results.map(s => `
      <div class="result-card-item">
        <div class="rc-title">${s.name} <span style="font-size:var(--font-size-xs);color:var(--text-dim)">${s.district}</span></div>
        <div class="rc-detail-row"><span class="rc-label">層級</span><span class="rc-value">${s.level}</span></div>
        <div class="rc-detail-row"><span class="rc-label">範圍</span><span class="rc-value" style="font-size:var(--font-size-xs)">${s.area || s.district}</span></div>
        <div class="rc-detail-row"><span class="rc-label">學區鄰里</span><span class="rc-value" style="font-size:var(--font-size-xs)">${(s.villages || []).join('、')}</span></div>
        <div class="rc-detail-row"><span class="rc-label">額滿狀態</span><span class="rc-value"><span class="tag ${s.quota === '額滿' ? 'tag-coral' : 'tag-green'}">${s.quota || '正常'}</span></span></div>
      </div>`).join('')}</div>
    <div style="font-size:10px;color:var(--text-dim);text-align:center;padding:12px">學區範圍以台北市政府教育局最新公告為準</div>`;
}
  const btn = $('#pk-search');
  const el = $('#pk-results');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>查詢中';

  try {
    const district = $('#pk-district').value;
    const keyword = ($('#pk-keyword').value || '').trim();
    const data = await DashboardAPI.getParking();
    const lots = data?.lots || [];

    let filtered = lots;
    if (district) filtered = filtered.filter(l => l.area === district || l.name.includes(district));
    if (keyword) filtered = filtered.filter(l => l.name.includes(keyword));

    if (!filtered.length) {
      el.innerHTML = '<div class="results-empty">查無符合條件的停車場</div>';
    } else {
      el.innerHTML = `<div class="results-header"><span>找到 <span class="results-count">${filtered.length}</span> 個停車場</span></div>
        <table class="result-table"><thead><tr><th>停車場名稱</th><th>剩餘車位</th><th>狀態</th></tr></thead>
        <tbody>${filtered.map(l => `<tr><td><span class="highlight">${l.name}</span></td><td>${l.available || 0} 位</td><td><span class="tag ${(l.available || 0) > 50 ? 'tag-green' : (l.available || 0) > 10 ? 'tag-gold' : 'tag-coral'}">${(l.available || 0) > 50 ? '充足' : (l.available || 0) > 10 ? '尚可' : '快滿'}</span></td></tr>`).join('')}</tbody></table>`;
    }
  } catch (e) {
    el.innerHTML = `<div class="results-empty">載入失敗：${e.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = '查詢車位';
  }
}

// ═══════════════════ TOOL: 司法案件全文查詢 ═══════════════════

async function searchJudicial() {
  const btn = $('#jd-search');
  const el = $('#jd-results');
  const caseNo = ($('#jd-caseno').value || '').trim();
  const keyword = ($('#jd-keyword').value || '').trim();

  if (!caseNo && !keyword) { el.innerHTML = '<div class="results-empty">請輸入案號或關鍵字</div>'; return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>搜尋中';

  try {
    const court = $('#jd-court').value;
    const year = $('#jd-year').value;
    const data = await DashboardAPI.searchJudicial(caseNo, keyword, court, year);
    const items = data?.items || [];

    if (!items.length) {
      el.innerHTML = '<div class="results-empty">查無相關裁判書，請更換查詢條件</div>';
    } else {
      el.innerHTML = `<div class="results-header"><span>找到 <span class="results-count">${items.length}</span> 筆裁判書</span></div>
        <div class="result-cards">${items.map(item => `
          <div class="result-card-item">
            <div class="rc-title">${item.case_no || ''} ${item.title || ''}</div>
            <div class="rc-meta"><span>${item.court || ''}</span><span>${item.date || ''}</span><span>${item.judge || ''}</span></div>
            <div class="rc-excerpt">${item.excerpt || item.summary || ''}</div>
            <div style="margin-top:8px;text-align:right"><a href="${item.url || '#'}" target="_blank" style="font-size:var(--font-size-xs);color:var(--accent-teal)">查看全文 →</a></div>
          </div>`).join('')}</div>`;
    }
  } catch (e) {
    el.innerHTML = `<div class="results-empty">司法院系統暫時無法連線，請稍後再試</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = '搜尋裁判書';
  }
}

// ═══════════════════ TOOL: 實價登錄查詢 ═══════════════════

async function searchRealEstate() {
  const btn = $('#re-search');
  const el = $('#re-results');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>查詢中';

  try {
    const params = {
      district: $('#re-district').value,
      address: ($('#re-address').value || '').trim(),
      type: $('#re-type').value,
      building: $('#re-building').value,
      startY: $('#re-startY').value,
      startM: $('#re-startM').value,
      endY: $('#re-endY').value,
      endM: $('#re-endM').value,
      priceMin: $('#re-price-min').value,
      priceMax: $('#re-price-max').value,
      areaMin: $('#re-area-min').value,
      areaMax: $('#re-area-max').value
    };
    const data = await DashboardAPI.searchRealEstate(params);
    const items = data?.items || [];

    if (!items.length) {
      el.innerHTML = '<div class="results-empty">查無符合條件的交易紀錄</div>';
    } else {
      el.innerHTML = `<div class="results-header"><span>找到 <span class="results-count">${items.length}</span> 筆交易紀錄</span><span style="font-size:var(--font-size-xs);color:var(--text-dim)">${data.source || ''}</span></div>
        <table class="result-table"><thead><tr><th>地址</th><th>類型</th><th>總價</th><th>單價</th><th>面積</th><th>交易日期</th></tr></thead>
        <tbody>${items.map(r => `<tr><td>${r.address || ''}</td><td>${r.type || ''} · ${r.building || ''}</td><td class="highlight">${r.total_price || ''} 萬</td><td>${r.unit_price || ''} 萬/坪</td><td>${r.area || ''} 坪</td><td>${r.date || ''}</td></tr>`).join('')}</tbody></table>`;
    }
  } catch (e) {
    el.innerHTML = '<div class="results-empty">實價登錄系統暫時無法連線，請稍後再試</div>';
  } finally {
    btn.disabled = false;
    btn.textContent = '查詢交易';
  }
}

// ═══════════════════ TOOL: 學區查詢 ═══════════════════

async function searchSchoolDist() {
  const btn = $('#sd-search');
  const el = $('#sd-results');
  const district = $('#sd-district').value;
  const address = ($('#sd-address').value || '').trim();
  if (!district || !address) { el.innerHTML = '<div class="results-empty">請選擇行政區並輸入路段</div>'; return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>查詢中';

  try {
    const data = await DashboardAPI.searchSchoolDist(district, address);
    const schools = data?.schools || [];

    if (!schools.length) {
      el.innerHTML = '<div class="results-empty">查無學區資料，請確認地址正確</div>';
    } else {
      el.innerHTML = `<div class="results-header"><span>找到 <span class="results-count">${schools.length}</span> 所學校</span></div>
        <div class="result-cards">${schools.map(s => `
          <div class="result-card-item">
            <div class="rc-title">${s.name || ''}</div>
            <div class="rc-meta"><span>${s.level || ''}</span><span>${s.type || '一般'}</span>${s.quota ? `<span class="tag ${s.quota.includes('額滿') ? 'tag-coral' : 'tag-green'}">${s.quota}</span>` : ''}</div>
            ${s.address ? `<div style="font-size:var(--font-size-xs);color:var(--text-dim);margin-top:6px">${s.address}</div>` : ''}
          </div>`).join('')}</div>`;
    }
  } catch (e) {
    el.innerHTML = '<div class="results-empty">學區查詢系統暫時無法連線</div>';
  } finally {
    btn.disabled = false;
    btn.textContent = '查詢學區';
  }
}
