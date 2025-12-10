# Quick Start: Test UserProfile với Polkadot.js Extension

## Bước 1: Tạo Account trong Extension (2 phút)

1. **Cài Extension** (nếu chưa có):
   - Chrome: https://chrome.google.com/webstore/detail/polkadot-js-extension/mopnmbcafieddcagagdcbnhejhlodfdd
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/polkadot-js-extension/

2. **Tạo Account:**
   - Click icon extension → "Add Account" → "Create new account"
   - Đặt tên: "Bicyverse Test"
   - **Lưu mnemonic seed phrase!**
   - Đặt password → "Add the account"
   - **Copy địa chỉ account** (bắt đầu bằng "5...")

## Bước 2: Lấy Test Tokens (1 phút)

### Cách nhanh nhất - Dùng Polkadot.js Apps:

1. **Mở:** https://polkadot.js.org/apps
2. **Connect:** Click network → Development → Local Node → `ws://127.0.0.1:9944` → Switch
3. **Transfer:**
   - Vào tab **Accounts**
   - Tìm **Alice** account (có sẵn balance ~1.15 mUNIT)
   - Click nút **"Send"** (mũi tên →) bên cạnh Alice
   - Paste địa chỉ account của bạn (từ extension)
   - Nhập amount: `1000` (UNIT)
   - Click **"Make Transfer"**
   - Transaction sẽ tự động được sign (dev mode)
4. **Kiểm tra:**
   - Tìm account của bạn trong danh sách
   - Xem "free balance" → Phải > 0

## Bước 3: Test trên Web App (2 phút)

1. **Start services:**

   ```bash
   # Terminal 1: Start node
   cd packages/solochain-template
   ./target/release/solochain-template-node --dev --tmp

   # Terminal 2: Start API
   cd apps/api
   pnpm run dev

   # Terminal 3: Start Web
   cd apps/web
   pnpm run dev
   ```

2. **Mở Web App:**
   - Vào: http://localhost:3001/userprofile

3. **Connect Wallet:**
   - Click **"Connect Wallet"**
   - Extension popup → Chọn account → **"Authorize"**

4. **Test UserProfile:**
   - Nhập username: `alice`
   - Click **"Set Username"**
   - Extension popup → Click **"Sign"**
   - Đợi transaction included (~2-3 giây)
   - Profile sẽ tự động load

5. **Kiểm tra:**
   - Username hiển thị trong "Current Profile"
   - Event listener tự động sync vào PostgreSQL
   - Check API: http://localhost:3000/users

## Troubleshooting

### ❌ "Inability to pay some fees"

**Giải pháp:** Chưa có balance → Làm Bước 2 để transfer token

### ❌ Extension không popup

**Giải pháp:**

- Refresh trang
- Kiểm tra extension đã enable
- Thử click "Connect Wallet" lại

### ❌ "Transaction failed"

**Giải pháp:**

- Kiểm tra node đang chạy: `ps aux | grep solochain-template-node`
- Kiểm tra balance > 0.1 UNIT
- Kiểm tra network: `ws://127.0.0.1:9944`

## Dev Accounts (Có sẵn balance)

- **Alice**: `5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY` ✅
- **Bob**: `5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty` ✅

Transfer từ các accounts này sang account của bạn!
