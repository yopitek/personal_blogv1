/**
 * TPE Dashboard v2.0 — Main App
 * Warm-toned card layout, real-time polling, graceful error handling.
 */
import { DashboardAPI } from './api.js';

// ── Fallback: ensure parking search functions exist even if api.js module fails ──
const _API_BASE = window.DASHBOARD_API || 'https://tpe-dashboard-api.goolai.workers.dev/api';
if (typeof DashboardAPI !== 'undefined' && !DashboardAPI.searchParkingAPI) {
  DashboardAPI.searchParkingAPI = async (keyword, district) => {
    const params = new URLSearchParams();
    if (keyword) params.set('q', keyword);
    if (district) params.set('district', district);
    try {
      const res = await fetch(`${_API_BASE}/parking/search?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) { console.warn('searchParkingAPI fallback:', e); return null; }
  };
}
if (typeof DashboardAPI !== 'undefined' && !DashboardAPI.searchParkingDistrict) {
  DashboardAPI.searchParkingDistrict = async (district) => {
    try {
      const res = await fetch(`${_API_BASE}/parking/district?district=${encodeURIComponent(district)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) { console.warn('searchParkingDistrict fallback:', e); return null; }
  };
}
window.DashboardAPI = DashboardAPI;

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
    <div class="parking-lot-list">${lots.map(l => {
      const count = l.available ?? l.slots ?? 0;
      return `<div class="parking-lot-item">
        <span class="pl-name">${l.name}</span>
        <span class="pl-slots${count < 50 ? ' low' : ''}">${count.toLocaleString()} 位</span>
      </div>`;
    }).join('')}</div>`);
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
  // "本月無補班" contains '補班' — must check it's not a "no makeup" message
  const isMakeup = data.makeup_day
    && data.makeup_day.includes('補班')
    && !data.makeup_day.includes('無');
  html(el, `
    <div class="holiday-badge">
      <div class="holiday-badge-label">${isMakeup ? '今日補班' : (data.school_status || '今日正常')}</div>
    </div>
    <div class="holiday-next">
      <span class="hn-label">下個假日</span>
      <span class="hn-value">${data.next_holiday?.name || ''} ${data.next_holiday?.date?.substring(5) || data.next_holiday?.date || ''}</span>
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
  initTabs();
  initTools();

  const inits = [
    initHero(), initWeather(), initAqi(), initEarthquake(),
    initWeekly(), initYoubike(), initHighway(), initParking(),
    initStock(), initAgriculture(), initEducation(), initActivities()
  ];

  inits.forEach(p => p.catch(() => {}));

  Promise.all(inits).then(() => {
    ['#weather-body', '#aqi-body', '#eq-body', '#weekly-body',
     '#youbike-body', '#highway-body', '#parking-body',
     '#stock-tw-body', '#stock-us-body', '#agri-body',
     '#holidays-body'].forEach(s => wireRetry(s, init));
    startPolling();
  }).catch(() => {});
}

function initTabs() {}

// ═══════════════════ TOOL: 停車位查詢 ═══════════════════

function initTools() {
  const sdDistrict = $('#sd-district');
  if (sdDistrict) {
    sdDistrict.addEventListener('change', updateVillages);
  }
  const sdSearchAddr = $('#sd-search-address');
  if (sdSearchAddr) {
    sdSearchAddr.addEventListener('click', () => searchSchoolDist('address'));
  }
  const sdSearchSch = $('#sd-search-school');
  if (sdSearchSch) {
    sdSearchSch.addEventListener('click', () => searchSchoolDist('school'));
  }
  const sdSchoolName = $('#sd-school-name');
  if (sdSchoolName) {
    sdSchoolName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); searchSchoolDist('school'); }
    });
  }
  const sdAddress = $('#sd-address');
  if (sdAddress) {
    sdAddress.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); searchSchoolDist('address'); }
    });
  }
}

document.addEventListener('DOMContentLoaded', init);

// Export tool functions to window (called from HTML onclick)
window._doSearchParking = searchParking;
window._doSearchJudicial = searchJudicial;
window._doSearchRealEstate = searchRealEstate;
window._doSearchSchoolDist = searchSchoolDist;
window.__switchSchoolMode = switchSchoolMode;

let _parkingMap = null;
let _parkingMarkers = [];

// ── Helpers ──────────────────────────────────────────────────────
function _availSlots(lot) { return lot.availablecar ?? lot.available ?? lot.slots ?? 0; }
function _slotTag(n) {
  if (n > 50) return ['tag-green', '充足'];
  if (n > 10) return ['tag-gold', '尚可'];
  if (n > 0)  return ['tag-coral', '快滿'];
  return ['tag-coral', '已滿'];
}
function _lotRow(lot, isMatch) {
  const a = _availSlots(lot);
  const [tagCls, tagLabel] = _slotTag(a);
  return `<tr class="${isMatch ? 'pk-row-match' : ''}" style="cursor:pointer"
    onclick="window._flyToParking&&window._flyToParking('${(lot.id||lot.name||'').replace(/'/g,'')}')"  >
    <td><span class="${isMatch ? 'highlight' : ''}">${lot.name||'—'}</span>
      ${lot.address ? `<div style="font-size:10px;color:var(--text-dim);margin-top:2px">${lot.address}</div>` : ''}
    </td>
    <td style="text-align:right;font-weight:600">${a} 位</td>
    <td><span class="tag ${tagCls}">${tagLabel}</span></td>
  </tr>`;
}

async function searchParking() {
  const btn = $('#pk-search');
  const el  = $('#pk-results');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>查詢中';

  try {
    const district = ($('#pk-district')?.value || '').trim();
    const keyword  = ($('#pk-keyword')?.value  || '').trim();

    if (!district && !keyword) {
      el.innerHTML = '<div class="results-empty">請選擇行政區或輸入停車場名稱</div>';
      return;
    }

    // Primary search: keyword + district (or just one of them)
    const data = await DashboardAPI.searchParkingAPI(keyword, district);
    if (!data) throw new Error('無法取得停車場資料');

    const allLots = data.lots || [];
    if (!allLots.length) {
      el.innerHTML = `<div class="results-empty">找不到符合「${keyword||district}」的停車場</div>`;
      return;
    }

    // Split: matched lots vs nearby (rest of district)
    let matchedLots, nearbyLots;

    if (keyword) {
      // Keyword search: matching = exact keyword, nearby = same district without keyword match
      matchedLots = allLots.filter(l => (l.name||'').includes(keyword));
      nearbyLots  = allLots.filter(l => !(l.name||'').includes(keyword));

      // If keyword-only (no district), fetch full district for nearby
      if (!district && matchedLots.length && matchedLots[0].area) {
        const nearbyData = await DashboardAPI.searchParkingAPI('', matchedLots[0].area);
        const nLots = nearbyData?.lots || [];
        const matchedIds = new Set(matchedLots.map(l => l.id));
        nearbyLots = nLots.filter(l => !matchedIds.has(l.id));
      }
    } else {
      // District-only: no matches to highlight, show all as nearby
      matchedLots = [];
      nearbyLots  = allLots;
    }

    const totalDistrict = matchedLots.length + nearbyLots.length;

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;min-height:480px">
        <div style="overflow-y:auto;max-height:480px;padding:var(--space-md)">
          ${matchedLots.length ? `
            <div class="pk-section-label">🔍 查詢結果 (${matchedLots.length})</div>
            <table class="result-table pk-table">
              <thead><tr><th>停車場</th><th>車位</th><th>狀態</th></tr></thead>
              <tbody>${matchedLots.map(l => _lotRow(l, true)).join('')}</tbody>
            </table>` : ''}

          ${nearbyLots.length ? `
            <div class="pk-section-label" style="margin-top:${matchedLots.length?'var(--space-lg)':'0'}">
              📍 ${matchedLots.length ? '同區其他停車場' : (district || allLots[0]?.area || '全區')} 停車場 (${nearbyLots.length})
            </div>
            <table class="result-table pk-table">
              <thead><tr><th>停車場</th><th>車位</th><th>狀態</th></tr></thead>
              <tbody>${nearbyLots.map(l => _lotRow(l, false)).join('')}</tbody>
            </table>` : ''}
        </div>
        <div id="parking-map" style="height:480px;border-radius:0 var(--card-radius-sm) var(--card-radius-sm) 0"></div>
      </div>
      <div style="padding:6px var(--space-md);font-size:10px;color:var(--text-dim);border-top:1px solid var(--border-divider)">
        共 ${totalDistrict} 個停車場 · 資料來源：臺北市停車管理工程處 TCMSV
      </div>`;

    setTimeout(() => initParkingMap(matchedLots, nearbyLots), 300);

  } catch (e) {
    el.innerHTML = `<div class="results-empty">載入失敗：${e.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = '查詢車位';
  }
}

function initParkingMap(matchedLots, nearbyLots) {
  const mapEl = document.getElementById('parking-map');
  if (!mapEl) return;
  if (_parkingMap) { _parkingMap.remove(); _parkingMap = null; }

  // Collect all lots with real coordinates from API
  const allForMap = [
    ...matchedLots.map(l => ({ ...l, _isMatch: true })),
    ...nearbyLots.map(l => ({ ...l, _isMatch: false })),
  ].filter(l => l.lat && l.lng);

  if (!allForMap.length) { mapEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-dim)">地圖資料不足</div>'; return; }

  // Center: average of all coords, or first matched lot
  const centerLot = matchedLots.find(l => l.lat && l.lng) || allForMap[0];
  _parkingMap = L.map('parking-map', {
    center: [centerLot.lat, centerLot.lng],
    zoom: matchedLots.length ? 15 : 14,
    zoomControl: true, attributionControl: false
  });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(_parkingMap);

  _parkingMarkers = [];
  allForMap.forEach(lot => {
    const a = _availSlots(lot);
    const isMatch = lot._isMatch;
    // Matched: bold green/gold/red circle; Nearby: smaller, semi-transparent
    const size = isMatch ? 36 : 28;
    const color = a > 50 ? '#5aaf7a' : a > 10 ? '#d4a44c' : '#e07070';
    const border = isMatch ? '3px solid #fff' : '2px solid rgba(255,255,255,0.7)';
    const opacity = isMatch ? '1' : '0.75';
    const icon = L.divIcon({
      className: '',
      html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;
               display:flex;align-items:center;justify-content:center;color:#fff;
               font-size:${isMatch?12:10}px;font-weight:700;
               box-shadow:0 2px 6px rgba(0,0,0,0.25);border:${border};opacity:${opacity}">
               ${a}</div>`,
      iconSize: [size, size], iconAnchor: [size/2, size/2]
    });
    const m = L.marker([lot.lat, lot.lng], { icon }).addTo(_parkingMap);
    m.bindPopup(`
      <b>${lot.name}</b><br>
      剩餘車位：<b style="color:${color}">${a} 位</b> / 總位：${lot.totalcar||'—'}<br>
      ${lot.address ? `<span style="font-size:11px;color:#666">${lot.address}</span>` : ''}
    `);
    m._lotId = lot.id || lot.name;
    if (isMatch) m.openPopup();
    _parkingMarkers.push(m);
  });

  // Fit map to show all markers
  if (allForMap.length > 1) {
    const bounds = L.latLngBounds(allForMap.map(l => [l.lat, l.lng]));
    _parkingMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }

  window._flyToParking = function(id) {
    const m = _parkingMarkers.find(m => m._lotId === id);
    if (m && _parkingMap) { _parkingMap.flyTo(m.getLatLng(), 16, { duration: 0.8 }); m.openPopup(); }
  };
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

const _SCHOOL_API = {
  byVillage: _API_BASE + '/school-village',
  byName: _API_BASE + '/school-search',
  neighbor: _API_BASE + '/school-neighbor',
};

async function _fetchSchoolApi(url, params, isPost = true) {
  const query = new URLSearchParams(params).toString();
  const fullUrl = query ? `${url}?${query}` : url;
  const res = await fetch(fullUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { return []; }
}

function _gradeLabel(code) {
  return String(code) === '3' ? '國民小學' : String(code) === '5' ? '國民中學' : '未知';
}

function _guessLevel(name) {
  if (/國小|實小|國民小學/.test(name)) return '國民小學';
  if (/國中|實中|高中國中部|國民中學/.test(name)) return '國民中學';
  return '';
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
  if (!village) { el.innerHTML = '<div class="results-empty">請選擇里名</div>'; return; }

  el.innerHTML = '<div class="results-empty"><span class="spinner"></span> 查詢學區中…</div>';

  try {
    const schools = await _fetchSchoolApi(_SCHOOL_API.byVillage, {
      district: district, village: village
    });

    let allSchools = schools.map(s => ({
      name: s.schoolName || '',
      level: _gradeLabel(s.schoolGrade),
      tel: s.TEL || '',
      address: s.ADDR || '',
      website: s.SITE || '',
      isBig: s.isBig !== '0',
      sect: s.sectName || district,
    }));

    if (address) {
      allSchools = allSchools.filter(s => (s.address || '').includes(address) || (s.name || '').includes(address));
    }

    if (!allSchools.length) {
      el.innerHTML = `<div class="results-empty">未找到 ${district} ${village} 的學區資料<br><span style="font-size:10px;color:var(--text-dim)">請確認行政區與里名是否正確</span></div>`;
      return;
    }

    el.innerHTML = `<div class="results-header"><span>${district} ${village} — 找到 <span class="results-count">${allSchools.length}</span> 所學校</span><span style="font-size:10px;color:var(--text-dim)">即時查詢</span></div>
    <div class="result-cards">${allSchools.map(s => `
      <div class="result-card-item">
        <div class="rc-title">${s.name}${s.isBig ? ' <span style="color:var(--gold);font-size:9px">大學區</span>' : ''}</div>
        <div class="rc-meta"><span>${s.level}</span><span>${s.address || s.sect}</span></div>
        ${s.tel ? `<div style="font-size:var(--font-size-xs);color:var(--text-dim);margin-top:4px">📞 ${s.tel}</div>` : ''}
        ${s.website ? `<div style="font-size:var(--font-size-xs);margin-top:2px"><a href="https://${s.website}" target="_blank" style="color:var(--accent-teal)">🔗 ${s.website}</a></div>` : ''}
      </div>`).join('')}</div>
    <div style="font-size:10px;color:var(--text-dim);text-align:center;padding:12px">資料來源：台北市政府教育局 schooldistrict.tp.edu.tw · 即時查詢，實際學區以當年公告為準</div>`;
  } catch (e) {
    el.innerHTML = `<div class="results-empty">學區查詢失敗：${e.message}<br><span style="font-size:10px;color:var(--text-dim)">請稍後再試</span></div>`;
  }
}

async function searchBySchool(el) {
  const level = $('#sd-level').value;
  const district = $('#sd-district2').value;
  const nameQ = ($('#sd-school-name').value || '').trim();
  if (!nameQ) { el.innerHTML = '<div class="results-empty">請輸入學校名稱關鍵字</div>'; return; }

  el.innerHTML = '<div class="results-empty"><span class="spinner"></span> 查詢學校中…</div>';

  try {
    const matched = await _fetchSchoolApi(_SCHOOL_API.byName, { q: nameQ });
    if (!matched.length) {
      el.innerHTML = '<div class="results-empty">未找到符合條件的學校，請更換關鍵字</div>';
      return;
    }

    const results = [];
    for (const s of matched) {
      let villages = [], districts = [];
      try {
        const neighbors = await _fetchSchoolApi(_SCHOOL_API.neighbor, { name: s.schoolName }, false);
        villages = [...new Set(neighbors.map(n => (n.lie || '') + '里'))].filter(v => v !== '里');
        districts = [...new Set(neighbors.map(n => n.sect || '').filter(Boolean))];
      } catch {}

      const guessedLevel = _guessLevel(s.schoolName);
      if (level === 'elementary' && guessedLevel === '國民中學') continue;
      if (level === 'junior' && guessedLevel === '國民小學') continue;
      if (district && !districts.includes(district) && !(s.ADDR || '').includes(district)) continue;

      results.push({
        name: s.schoolName,
        level: guessedLevel || '未知',
        tel: s.TEL || '',
        address: s.ADDR || '',
        website: s.SITE || '',
        isBig: s.isBig !== '0',
        villages, districts,
      });
    }

    if (!results.length) {
      el.innerHTML = '<div class="results-empty">未找到符合條件的學校，請更換關鍵字</div>';
      return;
    }

    el.innerHTML = `<div class="results-header"><span>找到 <span class="results-count">${results.length}</span> 所學校</span><span style="font-size:10px;color:var(--text-dim)">即時查詢</span></div>
    <div class="result-cards">${results.map(s => `
      <div class="result-card-item">
        <div class="rc-title">${s.name}${s.isBig ? ' <span style="color:var(--gold);font-size:9px">大學區</span>' : ''} <span style="font-size:var(--font-size-xs);color:var(--text-dim)">${(s.districts || []).join('、')}</span></div>
        <div class="rc-detail-row"><span class="rc-label">層級</span><span class="rc-value">${s.level}</span></div>
        <div class="rc-detail-row"><span class="rc-label">地址</span><span class="rc-value" style="font-size:var(--font-size-xs)">${s.address || ''}</span></div>
        ${s.tel ? `<div class="rc-detail-row"><span class="rc-label">電話</span><span class="rc-value" style="font-size:var(--font-size-xs)">${s.tel}</span></div>` : ''}
        <div class="rc-detail-row"><span class="rc-label">學區鄰里</span><span class="rc-value" style="font-size:var(--font-size-xs)">${(s.villages || []).join('、') || '查無範圍'}</span></div>
        ${s.website ? `<div class="rc-detail-row"><span class="rc-label">網站</span><span class="rc-value" style="font-size:var(--font-size-xs)"><a href="https://${s.website}" target="_blank" style="color:var(--accent-teal)">${s.website}</a></span></div>` : ''}
      </div>`).join('')}</div>
    <div style="font-size:10px;color:var(--text-dim);text-align:center;padding:12px">學區範圍以台北市政府教育局最新公告為準</div>`;
  } catch (e) {
    el.innerHTML = `<div class="results-empty">學校查詢失敗：${e.message}<br><span style="font-size:10px;color:var(--text-dim)">請稍後再試</span></div>`;
  }
}

    const results = [];
    for (const s of matched) {
      let villages = [], districts = [];
      try {
        const neighbors = await _fetchSchoolApi(_SCHOOL_API.neighbor, { name: s.schoolName }, false);
        villages = [...new Set(neighbors.map(n => (n.lie || '') + '里'))].filter(v => v !== '里');
        districts = [...new Set(neighbors.map(n => n.sect || '').filter(Boolean))];
      } catch {}

      const guessedLevel = _guessLevel(s.schoolName);
      if (level === 'elementary' && guessedLevel === '國民中學') continue;
      if (level === 'junior' && guessedLevel === '國民小學') continue;
      if (district && !districts.includes(district) && !(s.ADDR || '').includes(district)) continue;

      results.push({
        name: s.schoolName,
        level: guessedLevel || '未知',
        tel: s.TEL || '',
        address: s.ADDR || '',
        website: s.SITE || '',
        isBig: s.isBig !== '0',
        villages, districts,
      });
    }

    if (!results.length) {
      el.innerHTML = '<div class="results-empty">未找到符合條件的學校，請更換關鍵字</div>';
      return;
    }

    el.innerHTML = `<div class="results-header"><span>找到 <span class="results-count">${results.length}</span> 所學校</span><span style="font-size:10px;color:var(--text-dim)">即時查詢</span></div>
    <div class="result-cards">${results.map(s => `
      <div class="result-card-item">
        <div class="rc-title">${s.name}${s.isBig ? ' <span style="color:var(--gold);font-size:9px">大學區</span>' : ''} <span style="font-size:var(--font-size-xs);color:var(--text-dim)">${(s.districts || []).join('、')}</span></div>
        <div class="rc-detail-row"><span class="rc-label">層級</span><span class="rc-value">${s.level}</span></div>
        <div class="rc-detail-row"><span class="rc-label">地址</span><span class="rc-value" style="font-size:var(--font-size-xs)">${s.address || ''}</span></div>
        ${s.tel ? `<div class="rc-detail-row"><span class="rc-label">電話</span><span class="rc-value" style="font-size:var(--font-size-xs)">${s.tel}</span></div>` : ''}
        <div class="rc-detail-row"><span class="rc-label">學區鄰里</span><span class="rc-value" style="font-size:var(--font-size-xs)">${(s.villages || []).join('、') || '查無範圍'}</span></div>
        ${s.website ? `<div class="rc-detail-row"><span class="rc-label">網站</span><span class="rc-value" style="font-size:var(--font-size-xs)"><a href="https://${s.website}" target="_blank" style="color:var(--accent-teal)">${s.website}</a></span></div>` : ''}
      </div>`).join('')}</div>
    <div style="font-size:10px;color:var(--text-dim);text-align:center;padding:12px">學區範圍以台北市政府教育局最新公告為準</div>`;
  } catch (e) {
    el.innerHTML = `<div class="results-empty">學校查詢失敗：${e.message}<br><span style="font-size:10px;color:var(--text-dim)">請稍後再試</span></div>`;
  }
}

    const results = [];
    for (const s of matched) {
      let villages = [], districts = [];
      try {
        const neighbors = await _fetchSchoolApi(_SCHOOL_API.neighbor, { name: s.schoolName }, false);
        villages = [...new Set(neighbors.map(n => (n.lie || '') + '里'))].filter(v => v !== '里');
        districts = [...new Set(neighbors.map(n => n.sect || '').filter(Boolean))];
      } catch {}

      const guessedLevel = _guessLevel(s.schoolName);
      if (level === 'elementary' && guessedLevel === '國民中學') continue;
      if (level === 'junior' && guessedLevel === '國民小學') continue;
      if (district && !districts.includes(district) && !(s.ADDR || '').includes(district)) continue;

      results.push({
        name: s.schoolName,
        level: guessedLevel || '未知',
        tel: s.TEL || '',
        address: s.ADDR || '',
        website: s.SITE || '',
        isBig: s.isBig !== '0',
        villages, districts,
      });
    }

    if (!results.length) {
      el.innerHTML = '<div class="results-empty">未找到符合條件的學校，請更換關鍵字</div>';
      return;
    }

    el.innerHTML = `<div class="results-header"><span>找到 <span class="results-count">${results.length}</span> 所學校</span><span style="font-size:10px;color:var(--text-dim)">即時查詢</span></div>
    <div class="result-cards">${results.map(s => `
      <div class="result-card-item">
        <div class="rc-title">${s.name}${s.isBig ? ' <span style="color:var(--gold);font-size:9px">大學區</span>' : ''} <span style="font-size:var(--font-size-xs);color:var(--text-dim)">${(s.districts || []).join('、')}</span></div>
        <div class="rc-detail-row"><span class="rc-label">層級</span><span class="rc-value">${s.level}</span></div>
        <div class="rc-detail-row"><span class="rc-label">地址</span><span class="rc-value" style="font-size:var(--font-size-xs)">${s.address || ''}</span></div>
        ${s.tel ? `<div class="rc-detail-row"><span class="rc-label">電話</span><span class="rc-value" style="font-size:var(--font-size-xs)">${s.tel}</span></div>` : ''}
        <div class="rc-detail-row"><span class="rc-label">學區鄰里</span><span class="rc-value" style="font-size:var(--font-size-xs)">${(s.villages || []).join('、') || '查無範圍'}</span></div>
        ${s.website ? `<div class="rc-detail-row"><span class="rc-label">網站</span><span class="rc-value" style="font-size:var(--font-size-xs)"><a href="https://${s.website}" target="_blank" style="color:var(--accent-teal)">${s.website}</a></span></div>` : ''}
      </div>`).join('')}</div>
    <div style="font-size:10px;color:var(--text-dim);text-align:center;padding:12px">學區範圍以台北市政府教育局最新公告為準</div>`;
  } catch (e) {
    el.innerHTML = `<div class="results-empty">學校查詢失敗：${e.message}<br><span style="font-size:10px;color:var(--text-dim)">請稍後再試</span></div>`;
  }
}

// ═══════════════════ TOOL: 司法案件全文查詢 ═══════════════════

const TOOLS_API = window.location.hostname === 'localhost'
  ? 'http://localhost:8003/api'
  : 'https://tpe-dashboard-api.goolai.workers.dev/api';

const JUDICIAL_API = `${TOOLS_API}/legal/fulltext`;
const SCHOOL_DISTRICT_API = `${TOOLS_API}/school-district`;

// Cache fetched full texts so re-clicking is instant
const _fulltextCache = {};

function _buildMdContent(d) {
  return [
    `# ${d.title || d.case_number}`,
    '',
    `- **案件編號**: ${d.case_number}`,
    `- **法院**: ${d.court}`,
    `- **年度**: 民國 ${d.year} 年`,
    `- **案由**: ${d.title}`,
    `- **字數**: ${(d.char_count || 0).toLocaleString()} 字`,
    `- **來源**: ${d.source_url || '司法院裁判書系統'}`,
    `- **擷取方式**: ${d._source === 'mcp' ? 'Twinkle Hub MCP' : d._source === 'worker' ? 'Worker 直擷取' : 'Playwright 司法院'} (${d._elapsed}s)`,
    '',
    '---',
    '',
    '## 判決全文',
    '',
    d.jfull || ''
  ].join('\n');
}

function _downloadFile(filename, content, mime = 'text/plain;charset=utf-8') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

async function _fetchJudicialWithTimeout(caseNo, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(JUDICIAL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_number: caseNo }),
      signal: controller.signal
    });
    const data = await res.json().catch(() => ({}));
    if (data.error === 'blocked') {
      return data;
    }
    if (!res.ok) throw new Error(data.detail || data.error || '擷取失敗');
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('查詢逾時；請稍後再試，或直接前往司法院法學資料檢索系統查看全文');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Global: called by onclick on each "查看全文" button
window.__viewFulltext = async function(caseNo, btnEl) {
  const cardEl = btnEl.closest('.jd-result-card');
  const fullArea = cardEl.querySelector('.jd-fulltext-area');
  const actArea  = cardEl.querySelector('.jd-actions-area');

  // Toggle: if already shown, collapse
  if (fullArea.style.display === 'block') {
    fullArea.style.display = 'none';
    actArea.style.display  = 'none';
    btnEl.textContent = '查看全文 ▼';
    return;
  }

  btnEl.disabled = true;
  btnEl.textContent = '⏳ 擷取中…';

  try {
    // Use cache if available
    let data = _fulltextCache[caseNo];
    if (!data) {
      data = await _fetchJudicialWithTimeout(caseNo);
      _fulltextCache[caseNo] = data;
    }

    if (data.error === 'blocked') {
      fullArea.innerHTML = `
        <div style="padding:10px;border:1px solid rgba(248,113,113,.25);border-radius:6px;background:rgba(248,113,113,.06)">
          <div style="color:#fca5a5;font-size:12px;font-weight:600;margin-bottom:6px">⚠ 無法直接抓取此案件全文</div>
          <div style="color:var(--text-dim);font-size:11px;line-height:1.7">
            司法院網站有 F5 WAF 防護，Worker 無法直接擷取裁判書全文。<br>
            請至司法院法學資料檢索系統直接查詢。
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
            <button onclick="window.__copyCaseNo('${caseNo.replace(/'/g, "\\'")}')" class="jd-act-btn">📋 複製案號</button>
            <a href="${data.fallback_url || 'https://judgment.judicial.gov.tw/FJUD/default.aspx'}" target="_blank" class="jd-act-btn link">🔗 開啟司法院查詢</a>
          </div>
        </div>`;
      fullArea.style.display = 'block';
      btnEl.textContent = '查看全文 ▼';
      return;
    }

    const safeName = caseNo.replace(/\s/g, '_').replace(/[\/\\:*?"<>|]/g, '');
    const src = data._source === 'mcp' ? '⚡ MCP' : data._source === 'worker' ? '🌐 Worker' : '🌐 Playwright';

    // Render full text
    fullArea.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-size:10px;color:var(--text-dim);letter-spacing:.08em">判決全文 · ${(data.char_count||0).toLocaleString()} 字 · ${src} ${data._elapsed}s</span>
        <button onclick="this.closest('.jd-fulltext-area').querySelector('pre').classList.toggle('jd-text-expanded')" style="background:transparent;border:1px solid var(--border);border-radius:3px;color:var(--text-dim);cursor:pointer;font-size:10px;padding:2px 8px">展開/收合</button>
      </div>
      <pre class="jd-fulltext-pre">${data.jfull ? data.jfull.replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''}</pre>`;

    // Render action buttons
    actArea.innerHTML = `
      <button onclick="window.__copyJudicial('${caseNo}')" class="jd-act-btn">📋 複製全文</button>
      <button onclick="window.__dlJudicial('${caseNo}','txt')" class="jd-act-btn">⬇ .txt</button>
      <button onclick="window.__dlJudicial('${caseNo}','md')"  class="jd-act-btn accent">⬇ .md</button>
      ${data.source_url ? `<a href="${data.source_url}" target="_blank" class="jd-act-btn link">🔗 司法院原文</a>` : ''}`;

    fullArea.style.display = 'block';
    actArea.style.display  = 'flex';
    btnEl.textContent = '收合 ▲';

  } catch (err) {
    const msg = String(err?.message || '擷取失敗');
    const isCfTimeout = /timeout|Cloudflare|MCP|近期案件|舊案/i.test(msg);
    fullArea.innerHTML = isCfTimeout
      ? `
        <div style="padding:10px;border:1px solid rgba(248,113,113,.25);border-radius:6px;background:rgba(248,113,113,.06)">
          <div style="color:#fca5a5;font-size:12px;font-weight:600;margin-bottom:6px">⚠ 目前 Cloudflare 版無法直接抓到這筆全文</div>
          <div style="color:var(--text-dim);font-size:11px;line-height:1.7">
            這通常是因為該案件不在 Cloudflare Worker 可用的近期 MCP corpus 內，或 MCP 連線逾時。<br>
            你可以先複製案號，到司法院法學資料檢索系統直接查詢；之後補上 Railway fallback 後，這裡就能自動抓舊案全文。
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
            <button onclick="window.__copyCaseNo('${caseNo.replace(/'/g, "\\'")}')" class="jd-act-btn">📋 複製案號</button>
            <a href="https://judgment.judicial.gov.tw/FJUD/default.aspx" target="_blank" class="jd-act-btn link">🔗 開啟司法院查詢</a>
          </div>
        </div>`
      : `<div style="color:#f87171;font-size:12px;padding:8px">❌ ${msg}</div>`;
    fullArea.style.display = 'block';
    btnEl.textContent = '查看全文 ▼';
  } finally {
    btnEl.disabled = false;
  }
};

window.__copyJudicial = function(caseNo) {
  const d = _fulltextCache[caseNo];
  if (d?.jfull) navigator.clipboard.writeText(d.jfull).then(() => alert('已複製！'));
};

window.__copyCaseNo = function(caseNo) {
  navigator.clipboard.writeText(caseNo).then(() => alert('案號已複製，請到司法院貼上查詢'));
};

window.__dlJudicial = function(caseNo, fmt) {
  const d = _fulltextCache[caseNo];
  if (!d) return;
  const name = caseNo.replace(/\s/g,'_').replace(/[\/\\:*?"<>|]/g,'');
  if (fmt === 'txt') _downloadFile(`${name}.txt`, d.jfull || '');
  if (fmt === 'md')  _downloadFile(`${name}.md`, _buildMdContent(d), 'text/markdown;charset=utf-8');
};

function _renderJudicialCard(item) {
  const caseNo = (item.case_no || '').replace(/'/g, "\\'");
  return `
    <div class="jd-result-card result-card-item">
      <div class="rc-title">${item.case_no || ''} ${item.title || ''}</div>
      <div class="rc-meta">
        <span>${item.court || ''}</span>
        <span>${item.date || ''}</span>
        <span>${item.judge || ''}</span>
      </div>
      <div class="rc-excerpt">${item.excerpt || item.summary || ''}</div>
      <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center">
        ${item.url && item.url !== '#'
          ? `<a href="${item.url}" target="_blank" style="font-size:11px;color:var(--accent-teal)">🔗 司法院原文</a>`
          : '<span></span>'}
        <button class="jd-fulltext-btn" onclick="window.__viewFulltext('${caseNo}', this)">查看全文 ▼</button>
      </div>
      <div class="jd-fulltext-area" style="display:none;margin-top:10px"></div>
      <div class="jd-actions-area" style="display:none;gap:8px;flex-wrap:wrap;margin-top:8px"></div>
    </div>`;
}

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
      el.innerHTML = `
        <div class="results-header">
          <span>找到 <span class="results-count">${items.length}</span> 筆裁判書</span>
          <span style="font-size:10px;color:var(--text-dim)">點「查看全文」可直接顯示全文並下載 .txt / .md</span>
        </div>
        <div class="result-cards">${items.map(_renderJudicialCard).join('')}</div>`;
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
