# Bicyverse

Blockchain play-to-earn 3D bicycle racing game built on Substrate Solochain.

## Overview

Bicyverse là một game đua xe đạp 3D blockchain play-to-earn, nơi người chơi:

- Tạo và sở hữu nhân vật NFT (human 3D với đầy đủ chi tiết)
- Customize xe đạp từ các bộ phận (khung sườn, bánh xe, bàn đạp, tay lái)
- Đua xe trên 3 loại map khác nhau
- Kiếm rewards thông qua play-to-earn
- Hoàn thành quests để nhận airdrops

## Tech Stack

- **Blockchain**: Rust Substrate Solochain
- **API Backend**: NestJS (REST, WebSocket)
- **Game Services**: Go (RPC, WebSocket, REST)
- **Frontend Web**: React
- **Game Client**: C++ (3D game engine)
- **Database**: PostgreSQL (off-chain storage)

## Project Structure

```
bc/
├── apps/
│   ├── api/              # NestJS API server
│   └── web/              # React web frontend
├── packages/
│   └── solochain-template/  # Substrate blockchain
│       ├── pallets/
│       │   ├── template/     # Template pallet
│       │   ├── simple-counter/ # Test pallet
│       │   ├── nft/          # NFT pallet (TODO)
│       │   ├── character/    # Character pallet (TODO)
│       │   ├── bike/         # Bike pallet (TODO)
│       │   ├── skill/        # Skill pallet (TODO)
│       │   ├── race/         # Race pallet (TODO)
│       │   ├── rewards/      # Rewards pallet (TODO)
│       │   └── quest/        # Quest pallet (TODO)
│       ├── runtime/          # Runtime configuration
│       └── node/              # Node implementation
└── services/              # Go services (TODO)
    ├── indexer/          # Blockchain indexer
    ├── game/             # Game service
    └── websocket/        # WebSocket service
```

## Getting Started

### Prerequisites

- Rust (latest stable + nightly)
- Node.js 20+
- Go 1.21+
- PostgreSQL 15+
- pnpm

### Development

1. **Blockchain Node**:

```bash
cd packages/solochain-template
cargo build --release
./target/release/solochain-template-node --dev --tmp
```

2. **API Server**:

```bash
cd apps/api
pnpm install
pnpm run start:dev
```

3. **Web Frontend**:

```bash
cd apps/web
pnpm install
pnpm run dev
```

## Documentation

- [Architecture Design](./ARCHITECTURE.md) - Detailed system architecture
- [API Documentation](./apps/api/README.md) - API endpoints documentation

## Features

### Current

- ✅ Substrate Solochain template setup
- ✅ Simple counter pallet (test)

### In Progress

- 🚧 Character NFT pallet
- 🚧 Bike customization pallet
- 🚧 Race system pallet

### Planned

- ⏳ Web onboarding flow
- ⏳ Character creator UI
- ⏳ Game client integration
- ⏳ Play-to-earn rewards system

## License

MIT-0
