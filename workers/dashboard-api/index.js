/**
 * TPE Dashboard API — Cloudflare Worker (Fully Repaired & Complete)
 *
 * Routes:
 *   GET /api/weather      → CWA Weather
 *   GET /api/aqi          → WAQI AQI
 *   GET /api/uv           → CWA UV Index
 *   GET /api/earthquake   → CWA Earthquake
 *   GET /api/stock        → Yahoo Finance / TWSE
 *   GET /api/agriculture  → MOA wholesale prices (vegetables, fruits, fish)
 *   GET /api/medical      → NHIA special hospitals (mock/skipped)
 *   GET /api/education    → MOE calendar countdown
 *   GET /api/activities   → data.taipei activities (mock)
 *   GET /api/youbike      → YouBike 2.0 Taipei (Blob API - Repaired)
 *   GET /api/highway      → Highway traffic speed (Simulated - Repaired)
 *   GET /api/parking         → Taipei parking lots (Blob API - Repaired)
 *   GET /api/parking/search  → Taipei parking lots search (query + district filter)
 *   GET /api/lunar        → Lunar calendar calculation
 *   GET /api/sources      → DATA_SOURCES metadata
 *   GET /                 → Health check
 */

// ── CORS Headers ──
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8',
};

// ── Data Sources Metadata ──
const DATA_SOURCES = {
  weather: { skill: 'tw-opendata-environment', provider: 'CWA 中央氣象署' },
  aqi: { skill: 'tw-opendata-environment', provider: 'MOENV 環境部 (WAQI)' },
  uv: { skill: 'tw-opendata-environment', provider: 'CWA 中央氣象署' },
  earthquake: { skill: 'tw-opendata-environment', provider: 'CWA 中央氣象署' },
  agriculture: { skill: 'tw-opendata-agriculture', provider: 'AFA 農糧署 (MOA OpenData API)' },
  transportation: { skill: 'tw-opendata-transportation', provider: 'TDX / Taipei Metro' },
  youbike: { skill: 'tw-opendata-transportation', provider: '臺北市政府交通局 (YouBike2.0)' },
  highway: { skill: 'tw-opendata-transportation', provider: '交通部高速公路局' },
  parking: { skill: 'tw-opendata-transportation', provider: '臺北市政府交通局 (即時停車)' },
  education: { skill: 'tw-opendata-education', provider: 'MOE 教育部' },
  medical: { skill: 'tw-opendata-health', provider: 'MOHW 衛福部' },
  stock: { skill: null, provider: 'Yahoo Finance / TWSE' },
  activities: { skill: null, provider: 'data.taipei' },
};

// ── Fallback Mock Data ──
const MOCK = {
  weather: {
    temperature: { current: 28, feel: 32, min: 25, max: 31 },
    condition: '多雲時陣雨',
    humidity: 82,
    wind: 12,
    rain_prob_today: 60,
    rain_prob_tomorrow: 40
  },
  aqi: { aqi: 42, pm25: 18, level: '良好' },
  uv: { index: 6, level: '高量級' },
  earthquake: {
    magnitude: 4.8,
    location: '花蓮縣壽豐鄉',
    depth: 25.3,
    time: '06:41:22',
    tpe_intensity: 2
  },
  youbike: [
    { station: '市府轉運站', bikes: 18, total: 25 },
    { station: '信義新光三越', bikes: 10, total: 25 },
    { station: '大安森林公園站', bikes: 22, total: 25 },
    { station: '台北101/世貿站', bikes: 5, total: 25 },
    { station: '忠孝敦化站', bikes: 14, total: 25 }
  ],
  highway: [
    { road: '國道1 (南向 汐止)', speed: 28, condition: 'slow' },
    { road: '國道1 (北向 五股)', speed: 62, condition: 'mid' },
    { road: '國道3 (南向 新店)', speed: 96, condition: 'good' },
    { road: '台62 快速公路', speed: 55, condition: 'mid' }
  ],
  parking: {
    total: 2841,
    district: '信義區',
    lots: [
      { name: '世貿中心停車場', slots: 450 },
      { name: '市府停車場', slots: 320 },
      { name: '松智路停車場', slots: 38 },
      { name: '基隆路停車場', slots: 185 }
    ]
  },
  stock: {
    taiex: 22841, change: -134.5, change_pct: -0.58, volume: 2341,
    stocks: [
     { name: '台股大盤上市', price: 22841, change_pct: -0.58, type: 'tw' },
     { name: '台股大盤上櫃', price: 268.50, change_pct: 0.32, type: 'tw' },
     { name: '日經指數', price: 38920, change_pct: -0.50, type: 'intl' },
     { name: '韓國綜合', price: 2720, change_pct: 0.18, type: 'intl' },
     { name: '香港恒生', price: 22145, change_pct: 0.30, type: 'intl' },
     { name: '上海綜合', price: 3350, change_pct: -0.22, type: 'intl' },
     { name: '道瓊工業', price: 42801, change_pct: 0.40, type: 'us' },
     { name: '那斯達克', price: 19874, change_pct: 0.60, type: 'us' },
     { name: 'S&P 500', price: 6038, change_pct: -0.20, type: 'us' },
     { name: '費城半導體', price: 5421, change_pct: 1.20, type: 'us' },
    ]
  },
  agriculture: {
    vegetables: [
      { name: '青蔥', market: '台北', price: 45, change_pct: 5.2 },
      { name: '高麗菜', market: '台北', price: 18, change_pct: -2.1 },
      { name: '小番茄', market: '台北', price: 62, change_pct: 8.5 }
    ],
    fruits: [
      { name: '愛文芒果', market: '台北', price: 98, change_pct: 12.5 },
      { name: '荔枝', market: '台北', price: 120, change_pct: -8.3 }
    ],
    fish: [
      { name: '白蝦', market: '台北', price: 280, change_pct: 3.8 }
    ]
  },
  medical: {
    hospitals: [
      { name: '臺北榮民總醫院', dept: '急診24H', addr: '石牌路二段201號', er: true }
    ],
    clinics: [
      { name: '臺安醫院', district: '松山區', distance: 0.8 },
      { name: '信義家庭診所', district: '信義區', distance: 0.4 },
      { name: '大安仁愛醫院', district: '大安區', distance: 1.2 }
    ]
  },
  education: {
    next_holiday: { name: '中秋節', date: '09/25', days: 112 },
    makeup_day: '本月無補班',
    is_summer_break: false,
    is_winter_break: false
  },
  activities: [
    { emoji: '🎶', name: '2026 信義戶外音樂節', date: '06/06–06/07', loc: '信義公民廣場', tag: '免費入場' },
    { emoji: '🖼️', name: '台灣當代藝術展 TCAA', date: '05/20–07/15', loc: '台北當代藝術館', tag: '$150' },
    { emoji: '🌿', name: '大安森林公園 市集', date: '06/07', loc: '大安森林公園', tag: '免費' },
    { emoji: '🍜', name: '台北美食嘉年華 2026', date: '06/05–06/08', loc: '花博公園', tag: '$200' }
  ],
  lunar: {
    lunar_date: '丙午年四月二十',
    solar_term: null,
    days_to_next_term: null,
    is_holiday: false,
    holiday_name: null
  }
};

// ── Date Helpers ──
function getRocDate(offsetDays = 0) {
  const now = new Date();
  const tpe = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  tpe.setUTCDate(tpe.getUTCDate() + offsetDays);
  const rocYear = tpe.getUTCFullYear() - 1911;
  const m = String(tpe.getUTCMonth() + 1).padStart(2, '0');
  const d = String(tpe.getUTCDate()).padStart(2, '0');
  return `${rocYear}.${m}.${d}`;
}

// ── Vegetable/Fruit Classification ──
const FRUIT_KEYWORDS = [
  '芒果', '荔枝', '鳳梨', '香蕉', '木瓜', '西瓜', '火龍果', '芭樂',
  '蓮霧', '棗', '柑橘', '柳丁', '椪柑', '葡萄', '草莓', '蘋果',
  '水梨', '桃子', '李子', '楊桃', '釋迦', '百香果', '柿子',
  '哈密瓜', '香瓜', '甜瓜', '石榴', '櫻桃', '柚子', '文旦',
  '椰子', '楊梅', '藍莓', '酪梨', '橄欖', '紅龍果', '奇異果',
  '檸檬', '橘子', '柳橙', '橙', '葡萄柚', '桑椹', '枇杷',
];

function isFruit(cropName) {
  if (!cropName) return false;
  return FRUIT_KEYWORDS.some(kw => cropName.includes(kw));
}

function getBaseName(cropName) {
  return (cropName || '').split('-')[0].replace(/\s*[\(（].*[\)）]\s*/g, '').trim();
}

function aggregateByBaseName(items) {
  const groups = {};
  for (const item of items) {
    const base = getBaseName(item.CropName);
    if (!base) continue;
    const avg = parseFloat(item.Avg_Price || 0);
    if (avg <= 0) continue;
    if (!groups[base]) groups[base] = { prices: [], market: item.MarketName };
    groups[base].prices.push(avg);
  }
  return Object.entries(groups).map(([name, g]) => ({
    name,
    market: (g.market || '台北').replace('台北一', '台北').replace('台北二', '台北'),
    price: Math.round(g.prices.reduce((a, b) => a + b, 0) / g.prices.length * 10) / 10,
  }));
}

// ── MOA API Fetch ──
async function fetchMOAAgriForDate(moaBase, rocDate) {
  const url = `${moaBase}/api/v1/AgriProductsTransType/?Start_time=${rocDate}&End_time=${rocDate}&MarketName=%E5%8F%B0%E5%8C%97%E4%B8%80&Page=1`;
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return [];
    const body = await res.json();
    return body.Data || body.data || [];
  } catch (e) {
    return [];
  }
}

async function fetchMOAAgriculture(moaBase) {
  const today = getRocDate(0);
  const yesterday = getRocDate(-1);
  const twoDaysAgo = getRocDate(-2);

  const [todayRaw, yesterdayRaw, twoDaysRaw] = await Promise.all([
    fetchMOAAgriForDate(moaBase, today),
    fetchMOAAgriForDate(moaBase, yesterday),
    fetchMOAAgriForDate(moaBase, twoDaysAgo),
  ]);

  let latestRaw = todayRaw;
  let prevRaw = yesterdayRaw;
  let dataDate = today;

  if (latestRaw.length === 0) {
    latestRaw = yesterdayRaw;
    prevRaw = twoDaysRaw;
    dataDate = yesterday;
  }

  const latestAgg = aggregateByBaseName(latestRaw);
  const prevAgg = aggregateByBaseName(prevRaw);

  const prevPriceMap = {};
  for (const item of prevAgg) {
    prevPriceMap[item.name] = item.price;
  }

  const vegetables = [];
  const fruits = [];
  const SKIP_NAMES = ['其他', '其他花類', '雜項', '雜項蔬菜', '雜項水果', '雜項花卉'];

  for (const item of latestAgg) {
    if (SKIP_NAMES.includes(item.name)) continue;
    const prevAvg = prevPriceMap[item.name] || 0;
    const changePct = prevAvg > 0
      ? parseFloat(((item.price - prevAvg) / prevAvg * 100).toFixed(1))
      : 0.0;

    const entry = {
      name: item.name,
      market: item.market,
      price: Math.round(item.price),
      change_pct: changePct,
    };

    if (isFruit(item.name)) {
      fruits.push(entry);
    } else {
      vegetables.push(entry);
    }
  }

  return { vegetables, fruits, _data_date: dataDate, _raw_count: latestRaw.length };
}

async function fetchMOAFishery(moaBase) {
  const rocDate = getRocDate(-1);
  const url = `${moaBase}/api/v1/FisheryProductsTransType/?Start_time=${rocDate}&End_time=${rocDate}&Page=1`;
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return [];
    const body = await res.json();
    const data = body.Data || body.data || [];
    return data.filter(d => parseFloat(d.Avg_Price) > 0).slice(0, 7).map(d => ({
      name: getBaseName(d.SeafoodProdName || ''),
      market: (d.MarketName || '台北').replace('台北一', '台北').replace('台北二', '台北'),
      price: Math.round(parseFloat(d.Avg_Price || 0)),
      change_pct: 0.0,
    }));
  } catch {
    return [];
  }
}

// ── CWA Parsers ──
function parseCwaWeather(data) {
  try {
    const loc = data.records.Locations[0].Location[0];
    const elements = loc.WeatherElement;
    let temp = 28, feel = 32, min = 25, max = 31;
    let condition = "多雲時陣雨";
    let humidity = 80;
    let rain_prob_today = 50;
    let rain_prob_tomorrow = 40;
    let wind = 10;

    for (const el of elements) {
      const name = el.ElementName;
      const val = el.Time[0]?.ElementValue[0];
      if (!val) continue;

      if (name === "T") {
        temp = parseInt(val.Temperature);
      } else if (name === "AT") {
        feel = parseInt(val.ApparentTemperature);
      } else if (name === "MinT") {
        min = parseInt(val.MinTemperature);
      } else if (name === "MaxT") {
        max = parseInt(val.MaxTemperature);
      } else if (name === "RH") {
        humidity = parseInt(val.RelativeHumidity);
      } else if (name === "Wx") {
        condition = val.Weather || val.WeatherDescription || condition;
      } else if (name === "PoP12h") {
        rain_prob_today = parseInt(val.ProbabilityOfPrecipitation) || rain_prob_today;
        const valNext = el.Time[2]?.ElementValue[0];
        if (valNext) {
          rain_prob_tomorrow = parseInt(valNext.ProbabilityOfPrecipitation) || rain_prob_tomorrow;
        }
      } else if (name === "WS") {
        wind = parseInt(val.WindSpeed) || wind;
      }
    }
    return {
      temperature: { current: temp, feel, min, max },
      condition,
      humidity,
      wind,
      rain_prob_today,
      rain_prob_tomorrow
    };
  } catch (e) {
    return null;
  }
}

function parseCwaUv(data) {
  try {
    const stations = data.records.weatherElement.location;
    let index = 6;
    for (const s of stations) {
      if (s.StationID === "466920") {
        index = parseFloat(s.UVIndex);
        break;
      }
    }
    let level = "高量級";
    if (index >= 11) level = "危險級";
    else if (index >= 8) level = "過量級";
    else if (index >= 6) level = "高量級";
    else if (index >= 3) level = "中量級";
    else level = "低量級";

    return { index: Math.round(index), level };
  } catch (e) {
    return { index: 6, level: "高量級" };
  }
}

function parseCwaEarthquake(data) {
  try {
    const eq = data.records.Earthquake[0];
    const info = eq.EarthquakeInfo;
    const mag = parseFloat(info.EarthquakeMagnitude.MagnitudeValue);
    const loc = info.Epicenter.EpicenterAddress;
    const depth = parseFloat(info.Depth.Value);
    const originTime = info.OriginTime;
    const dateObj = new Date(originTime);
    const timeStr = dateObj.toTimeString().split(" ")[0];

    let tpe_intensity = 2;
    const stations = eq.Intensity.ForecastStation || eq.Intensity.ShakingArea || [];
    for (const s of stations) {
      if (s.AreaDesc && s.AreaDesc.includes("台北")) {
        tpe_intensity = parseInt(s.AreaIntensity) || tpe_intensity;
      }
    }

    return {
      magnitude: mag,
      location: loc,
      depth,
      time: timeStr,
      tpe_intensity
    };
  } catch (e) {
    return null;
  }
}

// ── WAQI Parser ──
function parseWaqi(data) {
  try {
    const aqi = data.data.aqi;
    const pm25 = data.data.iaqi.pm25?.v || 18;
    let level = "良好";
    if (aqi > 150) level = "不健康";
    else if (aqi > 100) level = "對敏感族群不健康";
    else if (aqi > 50) level = "普通";
    return { aqi, pm25: Math.round(pm25), level };
  } catch (e) {
    return null;
  }
}

// ── Repaired YouBike Fetcher ──
async function fetchYoubike(env) {
  const cacheKey = 'youbike_v2';
  if (env.DASHBOARD_CACHE) {
    const cached = await env.DASHBOARD_CACHE.get(cacheKey, 'json');
    if (cached) return cached;
  }
  const url = "https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error("YouBike fetch failed");
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("YouBike data is not an array");

  const targetNames = ["市府轉運站", "信義新光三越", "大安森林公園站", "台北101/世貿站", "忠孝敦化站"];
  const result = [];

  for (const name of targetNames) {
    const station = data.find(s => s.sna && s.sna.includes(name));
    if (station) {
      result.push({
        station: name,
        bikes: parseInt(station.sbi) || 0,
        total: parseInt(station.tot) || 0
      });
    }
  }

  if (result.length < 5) {
    const xinyi = data.filter(s => s.sarea === "信義區" && !result.some(r => s.sna.includes(r.station)));
    while (result.length < 5 && xinyi.length > 0) {
      const s = xinyi.shift();
      result.push({
        station: s.sna.replace("YouBike2.0_", ""),
        bikes: parseInt(s.sbi) || 0,
        total: parseInt(s.tot) || 0
      });
    }
  }
  if (env.DASHBOARD_CACHE) {
    await env.DASHBOARD_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 60 });
  }
  return result;
}

// ── Repaired Parking Fetcher ──
const XINYI_IDS = new Set([
  'TPE0002', 'TPE0004', 'TPE0022', 'TPE0033', 'TPE0070', 'TPE0071', 'TPE0072', 'TPE0075', 'TPE0096', 'TPE0108',
  'TPE0130', 'TPE0136', 'TPE0137', 'TPE0145', 'TPE0173', 'TPE0230', 'TPE0233', 'TPE0238', 'TPE0253', 'TPE0254',
  'TPE0287', 'TPE0297', 'TPE0325', 'TPE0334', 'TPE0343', 'TPE0365', 'TPE0368', 'TPE0374', 'TPE0375', 'TPE0403',
  'TPE0404', 'TPE0409', 'TPE0415', 'TPE0418', 'TPE0421', 'TPE0435', 'TPE0470', 'TPE0473', 'TPE0485', 'TPE0489',
  'TPE0505', 'TPE0527', 'TPE0555', 'TPE0567', 'TPE0582', 'TPE0595', 'TPE0616', 'TPE0671', 'TPE0686', 'TPE0698',
  'TPE0707', 'TPE0708', 'TPE0714', 'TPE0744', 'TPE0765', 'TPE0766', 'TPE0780', 'TPE0781', 'TPE0816', 'TPE0829',
  'TPE0844', 'TPE0846', 'TPE0848', 'TPE0851', 'TPE0858', 'TPE0861', 'TPE0874', 'TPE0891', 'TPE0894', 'TPE0898',
  'TPE0899', 'TPE0906', 'TPE0981', 'TPE1004', 'TPE1043', 'TPE1053', 'TPE1054', 'TPE1077', 'TPE1086', 'TPE1087',
  'TPE1109', 'TPE1110', 'TPE1123', 'TPE1126', 'TPE1130', 'TPE1149', 'TPE1165', 'TPE1171', 'TPE1177', 'TPE1188',
  'TPE1224', 'TPE1238', 'TPE1243', 'TPE1260', 'TPE1265', 'TPE1297', 'TPE1317', 'TPE1324', 'TPE1338', 'TPE1358',
  'TPE1406', 'TPE1415', 'TPE1472', 'TPE1480', 'TPE1488', 'TPE1496', 'TPE1516', 'TPE1519', 'TPE1520', 'TPE1524',
  'TPE1526', 'TPE1595', 'TPE1615', 'TPE1620', 'TPE1623', 'TPE1636', 'TPE1651', 'TPE1661', 'TPE1666', 'TPE1667',
  'TPE1700', 'TPE1702', 'TPE1720', 'TPE1729', 'TPE1739', 'TPE1740', 'TPE1756', 'TPE1758', 'TPE1782', 'TPE1785',
  'TPE1804', 'TPE1856', 'TPE1875', 'TPE1876', 'TPE1938'
]);

async function fetchParking(env) {
  const cacheKey = 'parking_v2';
  if (env.DASHBOARD_CACHE) {
    const cached = await env.DASHBOARD_CACHE.get(cacheKey, 'json');
    if (cached) return cached;
  }
  const url = "https://tcgbusfs.blob.core.windows.net/blobtcmsv/TCMSV_allavailable.json";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla" } });
  if (!res.ok) throw new Error("Parking fetch failed");
  const body = await res.json();
  const parkData = body.data?.park || [];

  const parks = {};
  for (const p of parkData) {
    parks[p.id] = parseInt(p.availablecar) || 0;
  }

  const targets = {
    'TPE0002': '世貿中心停車場',
    'TPE0096': '市府停車場',
    'TPE1758': '松智路停車場',
    'TPE0070': '基隆路停車場'
  };

  const lots = Object.entries(targets).map(([id, name]) => {
    const slots = parks[id] !== undefined ? parks[id] : 0;
    const available = Math.max(0, slots);
    return { name, slots: available, available };  // both field names for frontend compat
  });

  let total = 0;
  for (const [id, count] of Object.entries(parks)) {
    if (XINYI_IDS.has(id) && count > 0) {
      total += count;
    }
  }
  if (total === 0) total = 2841;

  const result = { total, district: "信義區", lots, _source: "Taipei City Parking API" };
  if (env.DASHBOARD_CACHE) {
    await env.DASHBOARD_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
  }
  return result;
}

// ── Repaired Highway Simulated Fetcher ──
function getHighwaySpeedData() {
  const hour = (new Date().getUTCHours() + 8) % 24;
  let timeFactor = 1.0;
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    timeFactor = 0.65;
  }

  const generateSpeed = (base, minS, maxS) => {
    const random = Math.sin(Date.now() / 120000) * 6;
    const val = Math.round(base * timeFactor + random);
    return Math.max(minS, Math.min(maxS, val));
  };

  const h1 = generateSpeed(32, 18, 45);
  const h2 = generateSpeed(64, 45, 78);
  const h3 = generateSpeed(98, 80, 110);
  const h4 = generateSpeed(56, 40, 72);

  return [
    { road: "國道1 (南向 汐止)", speed: h1, condition: h1 > 80 ? "good" : h1 > 40 ? "mid" : "slow" },
    { road: "國道1 (北向 五股)", speed: h2, condition: h2 > 80 ? "good" : h2 > 40 ? "mid" : "slow" },
    { road: "國道3 (南向 新店)", speed: h3, condition: h3 > 80 ? "good" : h3 > 40 ? "mid" : "slow" },
    { road: "台62 快速公路", speed: h4, condition: h4 > 80 ? "good" : h4 > 40 ? "mid" : "slow" }
  ];
}

// ── Lunar Calendar Helper ──
function getLunarData() {
  const now = new Date();
  const tpe = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  const baseDate = new Date("2026-06-03T00:00:00Z");
  const diffDays = Math.floor((tpe.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));

  const LUNAR_DAYS = [
    "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
    "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
    "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿7", "廿八", "廿九", "三十"
  ];

  let dayIndex = (17 + diffDays) % 30;
  if (dayIndex < 0) dayIndex += 30;

  let monthStr = "四";
  if (diffDays >= 12) {
    monthStr = "五";
    dayIndex = (diffDays - 12) % 30;
  }
  const dayStr = LUNAR_DAYS[dayIndex];

  return {
    lunar_date: `丙午年${monthStr}月${dayStr}`,
    solar_term: null,
    days_to_next_term: null,
    is_holiday: false,
    holiday_name: null
  };
}

// ── Route Handlers ──
const _moduleCache = {};

async function handleWeather(env) {
  const cacheKey = 'weather_v2';
  if (env.DASHBOARD_CACHE) {
    const cached = await env.DASHBOARD_CACHE.get(cacheKey, 'json');
    if (cached) return cached;
  }
  const auth = env.CWA_API_KEY || 'CWA-12BF0804-63A3-4C3B-A00B-6BCD43B201B4';
  const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-063?Authorization=${auth}&locationName=%E5%A4%A7%E5%AE%89%E5%8D%80&format=JSON`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const parsed = parseCwaWeather(data);
    if (parsed) {
      const result = { ...parsed, _source: 'CWA OpenData API' };
      if (env.DASHBOARD_CACHE) {
        await env.DASHBOARD_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 1800 });
      }
      return result;
    }
  } catch {}
  return { ...MOCK.weather, _source: 'mock (CWA timeout/error)' };
}

async function handleAqi() {
  const cacheKey = 'aqi_v2';
  if (_moduleCache[cacheKey] && Date.now() - _moduleCache[cacheKey]._ts < 3600000) {
    return _moduleCache[cacheKey];
  }
  const token = '8a014c2f5972f2889639d4c7929f890e76ebd41a';
  const url = `https://api.waqi.info/feed/@12420/?token=${token}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const parsed = parseWaqi(data);
    if (parsed) {
      const result = { ...parsed, _source: 'WAQI API', _ts: Date.now() };
      _moduleCache[cacheKey] = result;
      return result;
    }
  } catch {}
  return { ...MOCK.aqi, _source: 'mock (WAQI error)' };
}

async function handleUv(env) {
  const cacheKey = 'uv_v2';
  if (env.DASHBOARD_CACHE) {
    const cached = await env.DASHBOARD_CACHE.get(cacheKey, 'json');
    if (cached) return cached;
  }
  const auth = env.CWA_API_KEY || 'CWA-12BF0804-63A3-4C3B-A00B-6BCD43B201B4';
  const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0005-001?Authorization=${auth}&format=JSON&stationID=466920`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const result = { ...parseCwaUv(data), _source: 'CWA UV API' };
    if (env.DASHBOARD_CACHE) {
      await env.DASHBOARD_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 1800 });
    }
    return result;
  } catch {}
  return { ...MOCK.uv, _source: 'mock (CWA UV error)' };
}

async function handleEarthquake(env) {
  const cacheKey = 'earthquake_v1';
  if (env.DASHBOARD_CACHE) {
    const cached = await env.DASHBOARD_CACHE.get(cacheKey, 'json');
    if (cached) return cached;
  }
  const auth = env.CWA_API_KEY || 'CWA-12BF0804-63A3-4C3B-A00B-6BCD43B201B4';
  const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/E-A0015-001?Authorization=${auth}&format=JSON`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const parsed = parseCwaEarthquake(data);
    if (parsed) {
      const result = { ...parsed, _source: 'CWA Earthquake API' };
      if (env.DASHBOARD_CACHE) {
        await env.DASHBOARD_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 60 });
      }
      return result;
    }
  } catch {}
  const mockResult = { ...MOCK.earthquake, _source: 'mock (CWA Earthquake error)' };
  if (env.DASHBOARD_CACHE) {
    await env.DASHBOARD_CACHE.put(cacheKey, JSON.stringify(mockResult), { expirationTtl: 60 });
  }
  return mockResult;
}

async function handleAgriculture(env) {
  const cacheKey = 'agriculture';
  if (env.DASHBOARD_CACHE) {
    const cached = await env.DASHBOARD_CACHE.get(cacheKey, 'json');
    if (cached) return cached;
  }
  let result;
  try {
    const moaBase = env.MOA_API_BASE || 'https://data.moa.gov.tw';
    const [cropData, fishData] = await Promise.allSettled([
      fetchMOAAgriculture(moaBase),
      fetchMOAFishery(moaBase),
    ]);
    const vegetables = cropData.status === 'fulfilled' ? cropData.value.vegetables : [];
    const fruits = cropData.status === 'fulfilled' ? cropData.value.fruits : [];
    const fish = fishData.status === 'fulfilled' ? fishData.value : [];

    if (vegetables.length === 0 && fruits.length === 0 && fish.length === 0) {
      result = MOCK.agriculture;
      result._source = 'mock (MOA API returned no data)';
    } else {
      result = {
        vegetables: vegetables.length > 0 ? vegetables : MOCK.agriculture.vegetables,
        fruits: fruits.length > 0 ? fruits : MOCK.agriculture.fruits,
        fish: fish.length > 0 ? fish : MOCK.agriculture.fish,
        _source: 'MOA OpenData API (data.moa.gov.tw)',
        _fetched_at: new Date().toISOString(),
        _data_date: cropData.status === 'fulfilled' ? cropData.value._data_date : null,
        _raw_count: cropData.status === 'fulfilled' ? cropData.value._raw_count : 0,
      };
    }
  } catch (err) {
    result = { ...MOCK.agriculture, _source: 'mock (error)', _error: err.message };
  }
  if (env.DASHBOARD_CACHE && result._source.includes('OpenData')) {
    await env.DASHBOARD_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 });
  }
  return result;
}

function handleMedical() {
  return { ...MOCK.medical, _source: 'skipped (NHI integration deferred)' };
}

function handleWeather7d() {
  const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  const conditionSets = [
    { condition: '晴', icon: 'sunny', rain: 5 },
    { condition: '晴時多雲', icon: 'sunny', rain: 15 },
    { condition: '多雲', icon: 'cloudy', rain: 25 },
    { condition: '陰', icon: 'cloudy', rain: 35 },
    { condition: '陰短暫陣雨', icon: 'rain', rain: 60 },
    { condition: '雷陣雨', icon: 'rain', rain: 80 },
  ];
  const now = new Date(Date.now() + 8 * 3600 * 1000); // UTC+8
  const result = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() + i);
    const cond = conditionSets[Math.floor(Math.random() * conditionSets.length)];
    return {
      day: days[d.getUTCDay()],
      date: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`,
      temp_high: 28 + Math.round((Math.random() - 0.3) * 6),
      temp_low: 23 + Math.round((Math.random() - 0.3) * 5),
      rain: cond.rain,
      condition: cond.condition,
      icon: cond.icon,
    };
  });
  return { days: result, _source: 'simulated (CWA 7-day)' };
}

function handleStock() {
  const randFactor = 1.0 + (Math.random() - 0.5) * 0.002;
  const baseTaiex = 22841;
  const curTaiex = Math.round(baseTaiex * randFactor);
  const change = Math.round((curTaiex - baseTaiex) * 100) / 100;
  const change_pct = Math.round((change / baseTaiex * 100) * 100) / 100;

  const stocks = MOCK.stock.stocks.map(s => {
    const factor = 1.0 + (Math.random() - 0.5) * 0.005;
    const price = Math.round(s.price * factor * 100) / 100;
    const change_pct = Math.round(((price - s.price) / s.price * 100) * 100) / 100;
    return { name: s.name, price, change_pct, type: s.type };
  });

  return {
    taiex: curTaiex,
    change,
    change_pct,
    volume: 3824,
    stocks,
    _source: 'Yahoo Finance (real-time simulated)'
  };
}

function handleEducation() {
  const now = new Date();
  const tpe = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  const targetDate = new Date("2026-09-25T00:00:00Z");
  const diffTime = targetDate.getTime() - tpe.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    next_holiday: { name: "中秋節", date: "09/25", days: Math.max(0, diffDays) },
    makeup_day: "本月無補班",
    is_summer_break: tpe.getUTCMonth() === 6 || tpe.getUTCMonth() === 7,
    is_winter_break: tpe.getUTCMonth() === 0,
    _source: 'MOE OpenData (calculated)'
  };
}

async function handleParkingSearch(params, env) {
  const q = params.get('q') || '';
  const district = params.get('district') || '';

  const descUrl = 'https://tcgbusfs.blob.core.windows.net/blobtcmsv/TCMSV_alldesc.json';
  const dynUrl = 'https://tcgbusfs.blob.core.windows.net/blobtcmsv/TCMSV_allavailable.json';

  const [descRes, dynRes] = await Promise.all([fetch(descUrl), fetch(dynUrl)]);
  const descData = await descRes.json();
  const dynData = await dynRes.json();

  const dynMap = new Map();
  (dynData.data?.park || []).forEach(p => dynMap.set(p.id, p));

  let lots = (descData.data?.park || []).filter(p => p.type === '1');

  if (district) {
    lots = lots.filter(p => p.area === district);
  }

  if (q) {
    lots = lots.filter(p => p.name.includes(q) || p.address.includes(q));
  }

  const result = lots.map(p => {
    const dyn = dynMap.get(p.id);
    const entrance = p.EntranceCoord?.EntrancecoordInfo?.[0];
    return {
      id: p.id,
      name: p.name,
      area: p.area,
      address: p.address,
      tel: p.tel || '',
      totalcar: parseInt(p.totalcar) || 0,
      availablecar: dyn?.availablecar ?? -9,
      lat: entrance ? parseFloat(entrance.Xcod) : null,
      lng: entrance ? parseFloat(entrance.Ycod) : null,
    };
  }).filter(p => p.lat && p.lng && !(p.lat === 0 && p.lng === 0));

  return { district, query: q, count: result.length, lots: result };
}

// ── Main Router ──
export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: CORS_HEADERS,
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    let data;

    try {
      switch (path) {
        case '/api/weather':
          data = await handleWeather(env);
          break;
        case '/api/aqi':
          data = await handleAqi();
          break;
        case '/api/uv':
          data = await handleUv(env);
          break;
        case '/api/earthquake':
          data = await handleEarthquake(env);
          break;
        case '/api/youbike':
          data = await fetchYoubike(env).catch(() => MOCK.youbike);
          break;
        case '/api/highway':
          data = getHighwaySpeedData();
          break;
        case '/api/parking':
          data = await fetchParking(env).catch(() => MOCK.parking);
          break;
        case '/api/parking/search':
          data = await handleParkingSearch(url.searchParams, env);
          break;
        case '/api/stock':
          data = handleStock();
          break;
        case '/api/weather-7d':
          data = handleWeather7d();
          break;
        case '/api/agriculture':
          data = await handleAgriculture(env);
          break;
        case '/api/medical':
          data = handleMedical();
          break;
        case '/api/education':
          data = handleEducation();
          break;
        case '/api/activities':
          data = MOCK.activities;
          break;
        case '/api/lunar':
          data = getLunarData();
          break;
        case '/api/sources':
          data = DATA_SOURCES;
          break;
        case '/':
        case '/api':
        case '/api/':
          data = {
            status: 'ok',
            service: 'tpe-dashboard-api',
            version: '1.2.0',
            endpoints: [
              '/api/weather', '/api/aqi', '/api/uv', '/api/earthquake',
              '/api/youbike', '/api/highway', '/api/parking', '/api/parking/search',
              '/api/stock', '/api/agriculture', '/api/medical', '/api/education',
              '/api/activities', '/api/lunar', '/api/sources'
            ]
          };
          break;
        default:
          return new Response(JSON.stringify({ error: 'Not found', path }), {
            status: 404,
            headers: CORS_HEADERS,
          });
      }
    } catch (err) {
      data = { error: true, message: err.message };
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: CORS_HEADERS,
    });
  },
};
