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
    <div class="agri-source">${data.source || 'MOA 農業部'}${data.date ? ` · ${data.date}` : ''}</div>
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
}

document.addEventListener('DOMContentLoaded', init);
