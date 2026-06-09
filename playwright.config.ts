import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: 'https://zennote.app',
    userAgent: 'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    extraHTTPHeaders: {
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
    },
    viewport: { width: 1920, height: 1080 },
    locale: 'zh-TW',
    launchOptions: {
      args: ['--disable-blink-features=AutomationControlled']
    }
  },
  testDir: './tests/playwright',
  timeout: 30000,
  expect: {
    timeout: 10000
  }
});
