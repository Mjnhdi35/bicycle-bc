# Bicyverse Documentation

Tài liệu tổng hợp cho dự án Bicyverse - 3D Blockchain Play-to-Earn Bicycle Racing Game.

## 📚 Mục lục

### 🚀 Quick Start

- **[QUICK_START.md](./QUICK_START.md)** - Hướng dẫn nhanh để bắt đầu test UserProfile với Polkadot.js Extension

### 🔌 Wallet Integration

- **[POLKADOT_EXTENSION_GUIDE.md](./POLKADOT_EXTENSION_GUIDE.md)** - Hướng dẫn chi tiết sử dụng Polkadot.js Extension với Bicyverse
- **[GET_TEST_TOKENS.md](./GET_TEST_TOKENS.md)** - Hướng dẫn lấy test tokens cho Polkadot.js Extension

### 🏗️ Architecture

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Thiết kế kiến trúc hệ thống Bicyverse

## 📁 Cấu trúc dự án

```
bc/
├── apps/
│   ├── api/          # NestJS API (REST + WebSocket)
│   └── web/          # Next.js Frontend
├── packages/
│   └── solochain-template/  # Substrate Blockchain
│       ├── pallets/
│       │   ├── template/      # Template pallet
│       │   ├── simple-counter/  # Simple counter pallet
│       │   └── user-profile/     # User profile pallet
│       └── runtime/          # Runtime configuration
└── docs/             # Documentation (folder này)
```

## 🔗 Links hữu ích

- **Polkadot.js Apps**: https://polkadot.js.org/apps
- **Substrate Docs**: https://docs.substrate.io
- **Polkadot.js Extension**:
  - Chrome: https://chrome.google.com/webstore/detail/polkadot-js-extension/mopnmbcafieddcagagdcbnhejhlodfdd
  - Firefox: https://addons.mozilla.org/en-US/firefox/addon/polkadot-js-extension/

## 🛠️ Development

### Start Services

```bash
# Terminal 1: Start Substrate node
cd packages/solochain-template
./target/release/solochain-template-node --dev --tmp

# Terminal 2: Start API
cd apps/api
pnpm run dev

# Terminal 3: Start Web
cd apps/web
pnpm run dev
```

### Test UserProfile

1. Tạo account trong Polkadot.js Extension
2. Lấy test tokens từ Alice account (xem [GET_TEST_TOKENS.md](./GET_TEST_TOKENS.md))
3. Mở http://localhost:3001/userprofile
4. Connect wallet và test!

## 📝 Notes

- Tất cả documentation nên được đặt trong folder `docs/` này
- README.md của từng package/app nên giữ nguyên ở root của package/app đó
- Cập nhật index này khi thêm documentation mới
