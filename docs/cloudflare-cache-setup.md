# Cloudflare Cache Rules 設定手冊

> **此步驟需手動操作，無法由 CLI 完成**
> Zone ID: `1eeff79122e83fbe7c5894d92a6e69c9`
> Domain: `zennote.app`

---

## Step 1: 建立 Cache Rules 專用 API Token

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 點擊右上角頭像 → **My Profile**
3. 左側選單 → **API Tokens**
4. 點擊 **Create Token**
5. 選擇 **Create Custom Token**
6. 設定:
   - **Token name**: `zennote-cache-rules`
   - **Permissions**: `Zone` → `Cache Rules` → `Edit`
   - **Zone Resources**: `Include` → `Specific zone` → `zennote.app`
7. 點擊 **Continue to summary** → **Create Token**
8. **複製 token 並安全儲存**（只會顯示一次）

---

## Step 2: 設定 Cache Rules

### Rule 1: Static JS/CSS assets (long-term cache)

| 欄位 | 值 |
|------|-----|
| **When incoming requests match** | `URI Path` → `contains` → `/decoder/assets/` |
| **OR** | `URI Path` → `contains` → `/ig_card_tool/` |
| **Then** | **Eligible for cache** |
| **Edge TTL** | `Override` → `30 days` |
| **Browser TTL** | `Override` → `7 days` |

### Rule 2: Images (medium-term cache)

| 欄位 | 值 |
|------|-----|
| **When incoming requests match** | `URI Path` → `contains` → `/img/` |
| **Then** | **Eligible for cache** |
| **Edge TTL** | `Override` → `7 days` |
| **Browser TTL** | `Override` → `1 day` |

### Rule 3: News digest (short-term cache)

| 欄位 | 值 |
|------|-----|
| **When incoming requests match** | `URI Path` → `contains` → `/news_feed/` |
| **Then** | **Eligible for cache** |
| **Edge TTL** | `Override` → `1 hour` |
| **Browser TTL** | `Override` → `10 minutes` |

---

## Step 3: 驗證

設定完成後，等待 1-2 分鐘，然後:

```bash
# 驗證 JS bundle 有 HIT
curl -sI https://zennote.app/decoder/assets/index-*.js | grep cf-cache-status
# 第一次: MISS，第二次: HIT

# 驗證 logo image 有 HIT
curl -sI https://zennote.app/img/logo.webp | grep cf-cache-status
# 第一次: MISS，第二次: HIT
```

---

## 備註

- 目前所有資源 `cf-cache-status: DYNAMIC`（無快取）
- 設定完成後重複訪問速度提升 10x+
- Cache Rules 不影響 `news_feed/index.html` 的即時性（1 小時後自動過期）
