/**
 * TPE Dashboard API Client v2.0
 * All API calls go through Cloudflare Worker proxy.
 * Falls back to mock data when Worker is unavailable.
 */
const API_BASE = window.DASHBOARD_API || 'https://tpe-dashboard-api.goolai.workers.dev/api';

const MOCK = {
  weather: { temperature: { current: 28, feel: 32, min: 25, max: 31 }, condition: '多雲時陣雨', humidity: 82, wind: 12, rain_prob_today: 60, rain_prob_tomorrow: 40 },
  'weather-7d': { days: [{ day: '週四', date: '6/11', temp_high: 28, temp_low: 24, rain: 60, condition: '陰短暫陣雨', icon: 'rain' }, { day: '週五', date: '6/12', temp_high: 30, temp_low: 25, rain: 40, condition: '多雲', icon: 'cloudy' }, { day: '週六', date: '6/13', temp_high: 31, temp_low: 26, rain: 20, condition: '晴時多雲', icon: 'sunny' }, { day: '週日', date: '6/14', temp_high: 32, temp_low: 27, rain: 10, condition: '晴', icon: 'sunny' }, { day: '週一', date: '6/15', temp_high: 31, temp_low: 26, rain: 30, condition: '多雲', icon: 'cloudy' }, { day: '週二', date: '6/16', temp_high: 30, temp_low: 25, rain: 50, condition: '陰短暫陣雨', icon: 'rain' }, { day: '週三', date: '6/17', temp_high: 29, temp_low: 24, rain: 70, condition: '雷陣雨', icon: 'rain' }] },
  aqi: { aqi: 42, pm25: 18, pm10: 25, o3: 30, level: '良好', advice: '空氣品質良好，適合戶外活動' },
  uv: { index: 6, level: '高量級' },
  earthquake: { magnitude: 4.8, location: '花蓮縣壽豐鄉', depth: 25.3, time: '2026-06-10T06:41:22+08:00', tpe_intensity: 2 },
  youbike: [{ station: '市府轉運站', bikes: 18, empty: 7, total: 25, status: 'normal', district: '信義區' }, { station: '信義新光三越', bikes: 10, empty: 15, total: 25, status: 'normal', district: '信義區' }, { station: '大安森林公園', bikes: 22, empty: 3, total: 25, status: 'plenty', district: '大安區' }, { station: '台北101/世貿', bikes: 3, empty: 22, total: 25, status: 'hot', district: '信義區' }, { station: '忠孝敦化', bikes: 14, empty: 11, total: 25, status: 'normal', district: '大安區' }],
  highway: [{ road: '國道1 (南向 汐止)', speed: 28, condition: 'slow' }, { road: '國道1 (北向 五股)', speed: 62, condition: 'mid' }, { road: '國道3 (南向 新店)', speed: 96, condition: 'good' }, { road: '台62 快速公路', speed: 55, condition: 'mid' }],
  parking: { total: 2841, district: '信義區', lots: [{ name: '世貿中心', available: 450, total: 500 }, { name: '市府停車場', available: 320, total: 400 }, { name: '松智路停車場', available: 38, total: 80 }, { name: '基隆路停車場', available: 185, total: 250 }] },
  stock: { stocks: [{ symbol: '^TWII', name: '台股加權指數', price: 22841, change: -134.5, change_pct: -0.58, type: 'tw' }, { symbol: '^TWOII', name: '台股櫃買指數', price: 268.5, change: 0.8, change_pct: 0.32, type: 'tw' }, { symbol: '^DJI', name: '道瓊工業', price: 42801, change: 171, change_pct: 0.4, type: 'us' }, { symbol: '^IXIC', name: '那斯達克', price: 19874, change: 119, change_pct: 0.6, type: 'us' }, { symbol: '^GSPC', name: 'S&P 500', price: 6038, change: -12, change_pct: -0.2, type: 'us' }, { symbol: '^SOX', name: '費城半導體', price: 5421, change: 65, change_pct: 1.2, type: 'us' }, { symbol: '^N225', name: '日經225', price: 38920, change: -195, change_pct: -0.5, type: 'intl' }, { symbol: '^HSI', name: '香港恒生', price: 22145, change: 66, change_pct: 0.3, type: 'intl' }, { symbol: '^KS11', name: '韓國綜合', price: 2720, change: 5, change_pct: 0.18, type: 'intl' }, { symbol: '000001.SS', name: '上海綜合', price: 3350, change: -7, change_pct: -0.22, type: 'intl' }], updated: '', source: 'Yahoo Finance (mock)' },
  agriculture: { vegetables: [{ name: '高麗菜', market: '台北一', price: 22, change_pct: -3.5 }, { name: '青蔥', market: '台北一', price: 48, change_pct: 5.2 }, { name: '空心菜', market: '台北一', price: 28, change_pct: -1.3 }, { name: '苦瓜', market: '台北一', price: 34, change_pct: 0 }, { name: '茄子', market: '台北一', price: 38, change_pct: 3.7 }, { name: '花椰菜', market: '台北一', price: 42, change_pct: 6.0 }, { name: '小白菜', market: '台北一', price: 18, change_pct: 2.1 }, { name: '豆芽菜', market: '台北一', price: 14, change_pct: -0.8 }], fruits: [{ name: '愛文芒果', market: '台北一', price: 98, change_pct: 12.5 }, { name: '荔枝', market: '台北一', price: 115, change_pct: -8.3 }, { name: '鳳梨', market: '台北一', price: 55, change_pct: 3.2 }, { name: '香蕉', market: '台北一', price: 38, change_pct: 0 }, { name: '木瓜', market: '台北一', price: 45, change_pct: 6.8 }, { name: '西瓜', market: '台北一', price: 28, change_pct: -2.5 }], seafood: [{ name: '白蝦', market: '台北二', price: 280, change_pct: 3.8 }, { name: '吳郭魚', market: '台北二', price: 85, change_pct: -1.2 }, { name: '虱目魚', market: '台北二', price: 120, change_pct: 5.5 }], date: '', source: 'MOA' },
  education: { next_holiday: { name: '端午節', date: '2026-06-19', days: 8 }, makeup_day: '本月無補班', school_status: '學期中', is_summer_break: false, is_winter_break: false },
  activities: [{ name: '2026 台北藝術節', date: '06/01–07/15', location: '台北市各展演場地', tag: '部分免費' }, { name: '當代藝術雙年展', date: '05/20–08/31', location: '台北當代藝術館', tag: '$150' }, { name: '信義戶外音樂節', date: '06/14–06/15', location: '信義公民廣場', tag: '免費入場' }, { name: '松山文創市集', date: '06/21–06/22', location: '松山文創園區', tag: '免費' }, { name: '故宮特展', date: '05/01–09/30', location: '國立故宮博物院', tag: '$350' }],
  lunar: { lunar_date: '丙午年五月初九', solar_term: null, is_holiday: false }
};

async function apiFetch(endpoint) {
  try {
    const url = `${API_BASE}/${endpoint}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`API ${endpoint} failed: ${e.message}`);
    return null;
  }
}

function mockData(key) {
  return new Promise(resolve => setTimeout(() => resolve(MOCK[key]), 80 + Math.random() * 120));
}

export const DashboardAPI = {
  async getWeather() { return await apiFetch('weather') || await mockData('weather'); },
  async getWeather7d() { return await apiFetch('weather-7d') || await mockData('weather-7d'); },
  async getAqi() { return await apiFetch('aqi') || await mockData('aqi'); },
  async getUv() { return await apiFetch('uv') || await mockData('uv'); },
  async getEarthquake() { return await apiFetch('earthquake') || await mockData('earthquake'); },
  async getYoubike() { return await apiFetch('youbike') || await mockData('youbike'); },
  async getHighway() { return await apiFetch('highway') || await mockData('highway'); },
  async getParking() { return await apiFetch('parking') || await mockData('parking'); },
  async getStock() { return await apiFetch('stock') || await mockData('stock'); },
  async getAgriculture() { return await apiFetch('agriculture') || await mockData('agriculture'); },
  async getEducation() { return await apiFetch('education') || await mockData('education'); },
  async getActivities() { return await apiFetch('activities') || await mockData('activities'); },
  async getLunar() { return await apiFetch('lunar') || await mockData('lunar'); }
};
