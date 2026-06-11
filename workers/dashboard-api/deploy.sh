#!/bin/bash
# TPE Dashboard API Worker — One-Command Deploy
# Usage: CF_API_TOKEN=xxx ./deploy.sh
set -euo pipefail

cd "$(dirname "$0")"
echo "🚀 TPE Dashboard API Worker Deploy"

# 1. Auth
[ -z "${CF_API_TOKEN:-}" ] && { echo "❌ Set CF_API_TOKEN env var"; exit 1; }
export CLOUDFLARE_API_TOKEN="$CF_API_TOKEN"
echo "✅ CF_API_TOKEN set"

# 2. Get account ID
ACCOUNT_ID=$(npx wrangler whoami 2>&1 | grep -oP 'Account ID: \K[0-9a-f]+' || true)
if [ -z "$ACCOUNT_ID" ]; then
  echo "❌ Could not get account ID. Run 'npx wrangler whoami' manually."
  exit 1
fi
echo "✅ Account ID: $ACCOUNT_ID"

# 3. Update wrangler.toml with account_id
sed -i "s/^# account_id.*/account_id = \"$ACCOUNT_ID\"/" wrangler.toml
echo "✅ wrangler.toml updated"

# 4. Create KV namespace
KV_ID=$(npx wrangler kv:namespace create DASHBOARD_CACHE 2>&1 | grep -oP 'id = "\K[0-9a-f]+' || true)
if [ -z "$KV_ID" ]; then
  # Might already exist — try to list
  KV_ID=$(npx wrangler kv:namespace list 2>&1 | grep -oP 'DASHBOARD_CACHE.*?\K[0-9a-f]{32}' | head -1 || true)
fi
if [ -z "$KV_ID" ]; then
  echo "❌ Could not create/find KV namespace DASHBOARD_CACHE"
  exit 1
fi
sed -i "s/id = \"PLACEHOLDER_KV_ID\"/id = \"$KV_ID\"/" wrangler.toml
echo "✅ KV namespace: $KV_ID"

# 5. Set secrets
echo "Setting secrets..."
echo -n "$CWA_KEY" | npx wrangler secret put CWA_KEY
echo -n "$WAQI_TOKEN" | npx wrangler secret put WAQI_TOKEN
echo -n "$TH_KEY" | npx wrangler secret put TH_KEY
echo "✅ Secrets set"

# 6. Deploy
npx wrangler deploy --env=""
echo "✅ Worker deployed"

# 7. Show URL
WORKER_URL="https://tpe-dashboard-api.${CF_ACCOUNT_NAME:-your-subdomain}.workers.dev"
echo ""
echo "🎉 Deploy complete!"
echo "   Worker URL: (check wrangler output above)"
echo ""
echo "Next: Update API_BASE in static/dashboard/js/api.js to point to Worker URL"
