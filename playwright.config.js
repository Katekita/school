import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  reporter: 'list',
  timeout: 90000,
  use: {
    baseURL: 'http://127.0.0.1:5190',
    browserName: 'chromium',
    headless: true,
  },
  webServer: {
    command: 'npm run dev -- --host=127.0.0.1 --port=5190 --strictPort',
    url: 'http://127.0.0.1:5190',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
})
