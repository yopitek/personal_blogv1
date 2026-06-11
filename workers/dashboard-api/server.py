import http.server, json, urllib.request, urllib.parse, sys
from datetime import datetime

CWA_KEY = "CWA-12BF0804-63A3-4C3B-A00B-6BCD43B201B4"
WAQI_TOKEN = "8a014c2f5972f2889639d4c7929f890e76ebd41a"
TH_KEY = "sk--pyKU-tAYczCfBQB3wBaNw"

MOCK = {
    "weather": {"temperature":{"current":28,"feel":32,"min":25,"max":31},"condition":"多雲時陣雨","humidity":82,"wind":12,"rain_prob_today":60,"rain_prob_tomorrow":40},
    "aqi": {"aqi":42,"pm25":18,"level":"良好"},
    "uv": {"index":6,"level":"高量級"},
    "earthquake": {"magnitude":4.8,"location":"花蓮縣壽豐鄉","depth":25.3,"time":"06:41:22","tpe_intensity":2},
    "stock": {"taiex":22841,"change":-134.5,"change_pct":-0.58,"volume":2341,"stocks":[{"symbol":"0050","name":"元大台灣50","price":198.5,"change_pct":0.8},{"symbol":"DJIA","name":"道瓊工業","price":42801,"change_pct":0.4},{"symbol":"SPX","name":"S&P 500","price":6038,"change_pct":-0.2},{"symbol":"IXIC","name":"NASDAQ","price":19874,"change_pct":0.6},{"symbol":"SOX","name":"費城半導體","price":5421,"change_pct":1.2},{"symbol":"N225","name":"日經225","price":38920,"change_pct":-0.5},{"symbol":"HSI","name":"恒生","price":22145,"change_pct":0.3}]},
    "agriculture": {"vegetables":[{"name":"青蔥","market":"台北","price":45,"change_pct":5.2},{"name":"高麗菜","market":"台北","price":18,"change_pct":-2.1}]},
    "medical": {"hospitals":[{"name":"臺北榮民總醫院","dept":"急診24H","addr":"石牌路二段201號","er":True}],"clinics":[{"name":"臺安醫院","district":"松山區","distance":0.8}]},
    "education": {"next_holiday":{"name":"中秋節","date":"09/23","days":112},"makeup_day":"本月無補班","is_summer_break":False,"is_winter_break":False},
    "activities": [{"emoji":"🎶","name":"2026 信義戶外音樂節","date":"06/06-06/07","loc":"信義公民廣場","tag":"免費入場"}],
    "lunar": {"lunar_date":"丙午年五月初九","is_holiday":False},
    "youbike": [{"station":"市府轉運站","bikes":18,"total":25},{"station":"信義新光三越","bikes":10,"total":25}],
    "highway": [{"road":"國道1 南向 汐止","speed":28,"condition":"slow"}],
    "parking": {"total":2841,"district":"信義區","lots":[{"name":"世貿中心","slots":450}]},
}

def fetch_weather():
    url = f"https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-063?Authorization={CWA_KEY}&locationName=%E8%87%BA%E5%8C%97%E5%B8%82&limit=1"
    with urllib.request.urlopen(url, timeout=8) as r:
        d = json.loads(r.read())
    loc = d["records"]["Locations"][0]["Location"][0]
    els = {}
    for e in loc["WeatherElement"]:
        ev = e["Time"][0]["ElementValue"][0]
        els[e["ElementName"]] = list(ev.values())[0]
    return {
        "temperature": {"current":int(float(els.get("平均溫度",28))),"feel":int(float(els.get("最高體感溫度",32))),"min":int(float(els.get("最低溫度",25))),"max":int(float(els.get("最高溫度",31)))},
        "condition":els.get("天氣現象","多雲"),"humidity":int(float(els.get("平均相對濕度",80))),
        "wind":int(float(els.get("風速",10))),"rain_prob_today":int(float(els.get("12小時降雨機率",30))),"rain_prob_tomorrow":int(float(els.get("12小時降雨機率",30)))
    }

def fetch_aqi():
    url = f"https://api.waqi.info/feed/@12420/?token={WAQI_TOKEN}"
    with urllib.request.urlopen(url, timeout=8) as r:
        d = json.loads(r.read())["data"]
    aqi = d["aqi"]
    level = "良好" if aqi<=50 else "普通" if aqi<=100 else "對敏感族群不健康" if aqi<=150 else "不健康"
    return {"aqi":aqi,"pm25":d["iaqi"].get("pm25",{}).get("v",0),"level":level}

def fetch_lunar():
    today = datetime.now().strftime("%Y%m%d")
    p = json.dumps({"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"solar_to_lunar","arguments":{"date":today}}}).encode()
    req = urllib.request.Request("https://api.twinkleai.tw/mcp/", data=p, headers={"Content-Type":"application/json","Authorization":f"Bearer {TH_KEY}","Accept":"text/event-stream"}, method="POST")
    with urllib.request.urlopen(req, timeout=8) as r:
        body = r.read().decode()
    for line in body.split("\n"):
        line = line.strip()
        if line.startswith("data:"): line = line[5:].strip()
        if not line: continue
        try:
            obj = json.loads(line)
            if "result" in obj and "content" in obj["result"]:
                for c in obj["result"]["content"]:
                    if c["type"]=="text":
                        return {"lunar_date":c["text"].strip('"'),"is_holiday":False}
        except: continue
    return MOCK["lunar"]

def fetch_earthquake():
    url = f"https://opendata.cwa.gov.tw/api/v1/rest/datastore/E-A0015-001?Authorization={CWA_KEY}&limit=1"
    with urllib.request.urlopen(url, timeout=8) as r:
        d = json.loads(r.read())
    eq = d["records"]["Earthquake"][0]
    info = eq["EarthquakeInfo"]
    return {
        "magnitude": float(info["EarthquakeMagnitude"]["MagnitudeValue"]),
        "location": info["Epicenter"]["Location"],
        "depth": float(info["FocalDepth"]),
        "time": info["OriginTime"],
        "tpe_intensity": 2
    }

REAL = {"weather":fetch_weather,"aqi":fetch_aqi,"lunar":fetch_lunar,"earthquake":fetch_earthquake}

class Handler(http.server.BaseHTTPRequestHandler):
    def reply(self, data, code=200):
        self.send_response(code)
        self.send_header("Access-Control-Allow-Origin","*")
        self.send_header("Content-Type","application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())
    def do_GET(self):
        key = self.path.split("?")[0].replace("/api/","")
        if key == "health":
            return self.reply({"status":"ok"})
        fn = REAL.get(key)
        if fn:
            try: return self.reply(fn())
            except Exception as e: return self.reply(MOCK.get(key,{"error":str(e)}))
        return self.reply(MOCK.get(key,{"error":f"unknown:{key}"}))
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin","*")
        self.send_header("Access-Control-Allow-Methods","GET, OPTIONS")
        self.end_headers()
    def log_message(self, fmt, *args):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {args[0]}")

if __name__ == "__main__":
    port = int(sys.argv[2]) if len(sys.argv)>2 and sys.argv[1]=="--port" else 8787
    http.server.HTTPServer(("127.0.0.1",port), Handler).serve_forever()
