# Hướng dẫn sử dụng Polkadot.js Extension với Bicyverse

## 1. Cài đặt Polkadot.js Extension

### Chrome/Edge:

1. Vào: https://chrome.google.com/webstore/detail/polkadot-js-extension/mopnmbcafieddcagagdcbnhejhlodfdd
2. Click "Add to Chrome"
3. Click "Add extension"

### Firefox:

1. Vào: https://addons.mozilla.org/en-US/firefox/addon/polkadot-js-extension/
2. Click "Add to Firefox"

## 2. Tạo Account mới

1. **Mở Extension:**
   - Click icon Polkadot.js Extension trên browser
   - Hoặc click vào extension menu

2. **Tạo Account:**
   - Click "Add Account" hoặc nút "+"
   - Chọn "Create new account"
   - Đặt tên: "Bicyverse Test"
   - **QUAN TRỌNG:** Lưu mnemonic seed phrase ở nơi an toàn!
   - Đặt password
   - Click "Add the account with the generated seed"

3. **Copy Account Address:**
   - Click vào account vừa tạo
   - Copy địa chỉ (SS58 format, bắt đầu bằng "5...")

## 3. Lấy Test Tokens

### Cách 1: Dùng Polkadot.js Apps (Dễ nhất)

1. **Mở Polkadot.js Apps:**
   - Vào: https://polkadot.js.org/apps
   - Click network selector (góc trên bên trái)
   - Chọn "Development" tab
   - Click "Local Node" hoặc nhập: `ws://127.0.0.1:9944`
   - Click "Switch"

2. **Transfer từ Alice:**
   - Vào tab **Accounts**
   - Tìm account **Alice** (có sẵn balance)
   - Click nút "Send" (mũi tên phải)
   - Paste địa chỉ account của bạn (từ extension)
   - Nhập amount: `1000` (UNIT)
   - Click "Make Transfer"
   - Sign transaction (Alice account sẽ tự động sign trong dev mode)

3. **Kiểm tra Balance:**
   - Tìm account của bạn trong danh sách
   - Xem "free balance" - phải > 0

### Cách 2: Dùng Script (Nhanh hơn)

```bash
cd packages/solochain-template
npx ts-node scripts/transfer-tokens.ts <your_account_address> 1000
```

## 4. Sử dụng với Web App

1. **Mở Web App:**
   - Vào: http://localhost:3001/userprofile

2. **Connect Wallet:**
   - Click "Connect Wallet"
   - Extension sẽ popup
   - Chọn account bạn muốn dùng
   - Click "Authorize"

3. **Test UserProfile:**
   - Nhập username (ví dụ: `alice`)
   - Click "Set Username"
   - Extension sẽ popup để sign transaction
   - Click "Sign" trong extension
   - Đợi transaction được included

4. **Kiểm tra kết quả:**
   - Transaction status sẽ hiển thị trên web
   - Profile sẽ được load tự động sau khi transaction thành công
   - Event listener sẽ sync vào PostgreSQL

## 5. Troubleshooting

### "Inability to pay some fees" error:

- **Nguyên nhân:** Account không có đủ balance
- **Giải pháp:** Transfer token từ Alice account (xem bước 3)

### Extension không popup:

- Kiểm tra extension đã được enable
- Refresh trang web
- Thử click "Connect Wallet" lại

### Transaction failed:

- Kiểm tra node đang chạy: `ps aux | grep solochain-template-node`
- Kiểm tra balance: Phải > 0.1 UNIT
- Kiểm tra network connection: `ws://127.0.0.1:9944`

### Account không hiển thị:

- Đảm bảo đã tạo account trong extension
- Thử refresh extension
- Kiểm tra extension đã được authorize cho website

## 6. Dev Accounts (Có sẵn balance)

Trong dev mode, các accounts này có sẵn balance:

- **Alice**: `5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY`
- **Bob**: `5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty`
- **Charlie**: `5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJqX2dHStmcAoUjq`

Bạn có thể transfer từ các accounts này sang account của bạn.
