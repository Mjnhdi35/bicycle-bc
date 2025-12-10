# Hướng dẫn lấy Test Tokens cho Polkadot.js Extension

## Bước 1: Tạo Account trong Polkadot.js Extension

1. **Cài đặt Extension:**
   - Chrome: https://chrome.google.com/webstore/detail/polkadot-js-extension/mopnmbcafieddcagagdcbnhejhlodfdd
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/polkadot-js-extension/

2. **Tạo Account mới:**
   - Click vào extension icon
   - Click "Add Account" hoặc "+"
   - Chọn "Create new account"
   - Đặt tên account (ví dụ: "Test Account")
   - Lưu mnemonic seed phrase (QUAN TRỌNG!)
   - Đặt password
   - Click "Add the account with the generated seed"
   - Copy địa chỉ account (SS58 format)

## Bước 2: Lấy Test Tokens từ Dev Account

Trong dev mode, Substrate có sẵn các test accounts với balance:

- **Alice**: `5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY` (có sẵn balance)
- **Bob**: `5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty`
- **Charlie**: `5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJqX2dHStmcAoUjq`

### Cách 1: Dùng Polkadot.js Apps (Khuyến nghị)

1. Mở https://polkadot.js.org/apps
2. Connect đến local node: `ws://127.0.0.1:9944`
3. Vào **Accounts** → Chọn account **Alice** (có sẵn balance)
4. Click "Send" button
5. Paste địa chỉ account từ extension của bạn
6. Nhập số lượng (ví dụ: 1000 UNIT)
7. Click "Make Transfer"
8. Sign transaction

### Cách 2: Dùng Script tự động

Chạy script để transfer token tự động (xem file `transfer-tokens.ts`)

## Bước 3: Kiểm tra Balance

1. Vào Polkadot.js Apps → **Accounts**
2. Tìm account của bạn
3. Kiểm tra "free balance" - phải > 0 để có thể submit transactions

## Bước 4: Test UserProfile

Sau khi có balance:

1. Vào **Developer** → **Extrinsics**
2. Chọn account của bạn (từ extension)
3. Chọn pallet: `userProfile`
4. Chọn extrinsic: `setUsername`
5. Nhập username (ví dụ: `alice`)
6. Click "Submit Transaction"
7. Sign với extension
8. Đợi transaction được included

## Lưu ý

- Mỗi transaction cần trả phí (transaction fee)
- Đảm bảo balance > 0.1 UNIT để có thể submit transactions
- Trong dev mode, bạn có thể transfer từ Alice account (có sẵn balance)
