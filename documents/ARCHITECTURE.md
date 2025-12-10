# Bicyverse Architecture

## Overview

Bicyverse là một game blockchain play-to-earn đua xe đạp 3D, được xây dựng trên Substrate Solochain với client game C++ và web interface React.

## Tech Stack

- **Blockchain**: Rust Substrate Solochain
- **API Backend**: NestJS (REST, WebSocket)
- **Game Service**: Go (RPC, WebSocket, REST)
- **Frontend Web**: React
- **Game Client**: C++ (3D game engine)
- **Database**: PostgreSQL (off-chain storage)
- **Communication**: RPC, WebSocket, REST

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Web Frontend (React)                      │
│  - Onboarding & Wallet Connection                                │
│  - Character Creator                                              │
│  - Dashboard (NFTs, Stats, Rewards)                              │
│  - Game Launcher                                                  │
└────────────┬──────────────────────────────────────────────────────┘
             │ REST/WebSocket
             │
┌────────────▼──────────────────────────────────────────────────────┐
│                    API Layer (NestJS)                             │
│  - Auth Module (Web3 wallet, JWT)                                │
│  - Character Module (NFT sync, selection)                         │
│  - Bike Module (customization, parts)                             │
│  - Race Module (results, leaderboard)                              │
│  - Quest Module (onboarding, rewards)                             │
│  - Substrate Service (RPC/WS client)                              │
└────────────┬──────────────────────────────────────────────────────┘
             │ REST/WebSocket
             │
┌────────────▼──────────────────────────────────────────────────────┐
│                  Game Services (Go)                               │
│  - Indexer Service (blockchain events → PostgreSQL)              │
│  - Game Service (race results, validation, rewards)                │
│  - WebSocket Service (real-time updates)                          │
└────────────┬──────────────────────────────────────────────────────┘
             │ RPC/WebSocket
             │
┌────────────▼──────────────────────────────────────────────────────┐
│              Blockchain (Substrate Solochain)                     │
│  - NFT Pallet (Character NFTs)                                     │
│  - Character Pallet (stats, ownership)                            │
│  - Bike Pallet (parts, customization)                             │
│  - Skill Pallet (skill books, attachment)                         │
│  - Race Pallet (maps, results, rewards)                            │
│  - Rewards Pallet (play-to-earn tokens)                            │
│  - Quest Pallet (onboarding tasks)                                │
└───────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Game Client (C++)                              │
│  - Authentication (blockchain account)                           │
│  - Character Rendering (3D model from NFT metadata)              │
│  - Bike Customization (parts assembly)                            │
│  - Race System (3 map types)                                      │
│  - Stats System (energy, water)                                   │
└────────────┬──────────────────────────────────────────────────────┘
             │ REST/WebSocket
             │
             ▼
      ┌──────────────┐
      │  Go Services │
      └──────────────┘
```

## Database Schema (PostgreSQL)

### Core Tables

```sql
-- Users & Accounts
users (
  id UUID PRIMARY KEY,
  wallet_address VARCHAR(66) UNIQUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Characters (NFT metadata)
characters (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  nft_id BIGINT, -- On-chain NFT ID
  name VARCHAR(255),
  metadata JSONB, -- {eyes, nose, mouth, hands, legs, muscles, actions}
  energy INTEGER DEFAULT 100,
  water INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Bikes
bikes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  nft_id BIGINT,
  name VARCHAR(255),
  frame_part_id BIGINT,
  wheel_part_id BIGINT,
  pedal_part_id BIGINT,
  handlebar_part_id BIGINT,
  stats JSONB, -- {speed, durability, etc}
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Bike Parts (NFT)
bike_parts (
  id UUID PRIMARY KEY,
  nft_id BIGINT,
  part_type VARCHAR(50), -- frame, wheel, pedal, handlebar
  name VARCHAR(255),
  metadata JSONB,
  stats JSONB,
  created_at TIMESTAMP
)

-- Skills
skills (
  id UUID PRIMARY KEY,
  nft_id BIGINT,
  name VARCHAR(255),
  description TEXT,
  effect JSONB,
  created_at TIMESTAMP
)

-- Character Skills (many-to-many)
character_skills (
  character_id UUID REFERENCES characters(id),
  skill_id UUID REFERENCES skills(id),
  attached_at TIMESTAMP,
  PRIMARY KEY (character_id, skill_id)
)

-- Races
races (
  id UUID PRIMARY KEY,
  character_id UUID REFERENCES characters(id),
  bike_id UUID REFERENCES bikes(id),
  map_type VARCHAR(50), -- map1, map2, map3
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  result JSONB, -- {position, time, score, rewards}
  on_chain_tx_hash VARCHAR(66),
  created_at TIMESTAMP
)

-- Quests
quests (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  quest_type VARCHAR(50), -- onboarding, daily, weekly
  rewards JSONB,
  requirements JSONB,
  created_at TIMESTAMP
)

-- Quest Completions
quest_completions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  quest_id UUID REFERENCES quests(id),
  completed_at TIMESTAMP,
  rewards_claimed BOOLEAN DEFAULT false,
  on_chain_tx_hash VARCHAR(66)
)

-- Rewards
rewards (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  reward_type VARCHAR(50), -- race, quest, airdrop
  amount DECIMAL(18, 8),
  token_type VARCHAR(50),
  source_id UUID, -- race_id, quest_id, etc
  on_chain_tx_hash VARCHAR(66),
  claimed_at TIMESTAMP,
  created_at TIMESTAMP
)

-- Transactions (on-chain sync)
transactions (
  id UUID PRIMARY KEY,
  tx_hash VARCHAR(66) UNIQUE,
  block_number BIGINT,
  pallet_name VARCHAR(100),
  call_name VARCHAR(100),
  data JSONB,
  status VARCHAR(50), -- pending, success, failed
  created_at TIMESTAMP
)
```

## Blockchain Pallets Design

### 1. NFT Pallet (`pallet-nft`)

- **Purpose**: Quản lý Character NFTs
- **Storage**:
  - `Characters<T>`: Map NFT ID → Character metadata
  - `Owners<T>`: Map NFT ID → Account ID
- **Extrinsics**:
  - `mint_character(origin, metadata)` - Mint character NFT cho user
  - `transfer(origin, to, nft_id)` - Transfer NFT
- **Events**:
  - `CharacterMinted { nft_id, owner, metadata }`
  - `CharacterTransferred { nft_id, from, to }`

### 2. Character Pallet (`pallet-character`)

- **Purpose**: Quản lý character stats và selection
- **Storage**:
  - `CharacterStats<T>`: Map Account ID → Map NFT ID → Stats (energy, water)
  - `ActiveCharacter<T>`: Map Account ID → Active NFT ID
- **Extrinsics**:
  - `set_active_character(origin, nft_id)` - Chọn character để chơi
  - `update_energy(origin, nft_id, amount)` - Update năng lượng
  - `update_water(origin, nft_id, amount)` - Update nước
- **Events**:
  - `CharacterActivated { account, nft_id }`
  - `StatsUpdated { nft_id, energy, water }`

### 3. Bike Pallet (`pallet-bike`)

- **Purpose**: Quản lý xe đạp và parts
- **Storage**:
  - `Bikes<T>`: Map Bike ID → Bike data (parts, stats)
  - `BikeOwners<T>`: Map Bike ID → Account ID
  - `BikeParts<T>`: Map Part ID → Part metadata
- **Extrinsics**:
  - `mint_bike_part(origin, part_type, metadata)` - Mint bike part NFT
  - `assemble_bike(origin, frame_id, wheel_id, pedal_id, handlebar_id)` - Tạo bike từ parts
  - `customize_bike(origin, bike_id, part_updates)` - Customize bike
- **Events**:
  - `BikePartMinted { part_id, part_type, owner }`
  - `BikeAssembled { bike_id, owner, parts }`

### 4. Skill Pallet (`pallet-skill`)

- **Purpose**: Quản lý skill books
- **Storage**:
  - `Skills<T>`: Map Skill ID → Skill data
  - `CharacterSkills<T>`: Map (NFT ID, Skill ID) → Attached
- **Extrinsics**:
  - `mint_skill(origin, skill_data)` - Mint skill book NFT
  - `attach_skill(origin, character_nft_id, skill_id)` - Gắn skill vào character
  - `detach_skill(origin, character_nft_id, skill_id)` - Tháo skill
- **Events**:
  - `SkillMinted { skill_id, owner }`
  - `SkillAttached { character_nft_id, skill_id }`

### 5. Race Pallet (`pallet-race`)

- **Purpose**: Quản lý đua xe và rewards
- **Storage**:
  - `Races<T>`: Map Race ID → Race data
  - `RaceResults<T>`: Map Race ID → Results
- **Extrinsics**:
  - `start_race(origin, character_nft_id, bike_id, map_type)` - Bắt đầu race
  - `submit_race_result(origin, race_id, result_data)` - Submit kết quả từ game
  - `claim_race_reward(origin, race_id)` - Claim reward
- **Events**:
  - `RaceStarted { race_id, character_nft_id, map_type }`
  - `RaceCompleted { race_id, position, rewards }`

### 6. Rewards Pallet (`pallet-rewards`)

- **Purpose**: Quản lý play-to-earn rewards
- **Storage**:
  - `Rewards<T>`: Map Account ID → Pending rewards
  - `RewardHistory<T>`: Map Account ID → Reward history
- **Extrinsics**:
  - `claim_reward(origin, reward_id)` - Claim reward
  - `distribute_reward(origin, account, amount, reason)` - Admin distribute
- **Events**:
  - `RewardDistributed { account, amount, reason }`
  - `RewardClaimed { account, amount }`

### 7. Quest Pallet (`pallet-quest`)

- **Purpose**: Quản lý onboarding và quests
- **Storage**:
  - `Quests<T>`: Map Quest ID → Quest data
  - `QuestCompletions<T>`: Map (Account ID, Quest ID) → Completed
- **Extrinsics**:
  - `complete_quest(origin, quest_id)` - Hoàn thành quest
  - `claim_quest_reward(origin, quest_id)` - Claim quest reward
- **Events**:
  - `QuestCompleted { account, quest_id }`
  - `QuestRewardClaimed { account, quest_id, rewards }`

## API Endpoints (NestJS)

### Auth

- `POST /auth/wallet-connect` - Connect wallet
- `POST /auth/login` - Login với wallet signature
- `POST /auth/refresh` - Refresh JWT token

### Characters

- `GET /characters` - List user's characters
- `GET /characters/:id` - Get character details
- `POST /characters/create` - Create character (mint NFT)
- `POST /characters/:id/activate` - Set active character
- `PUT /characters/:id/stats` - Update stats

### Bikes

- `GET /bikes` - List user's bikes
- `GET /bikes/:id` - Get bike details
- `POST /bikes/assemble` - Assemble bike from parts
- `PUT /bikes/:id/customize` - Customize bike

### Races

- `POST /races/start` - Start race
- `POST /races/:id/result` - Submit race result
- `GET /races/:id` - Get race details
- `GET /races/leaderboard` - Get leaderboard

### Quests

- `GET /quests` - List available quests
- `GET /quests/:id` - Get quest details
- `POST /quests/:id/complete` - Complete quest
- `POST /quests/:id/claim` - Claim quest reward

## Go Services

### Indexer Service

- Lắng nghe blockchain events qua WebSocket
- Parse và lưu vào PostgreSQL
- Sync NFT metadata, character stats, race results

### Game Service

- Nhận race results từ game client
- Validate results
- Tính toán rewards
- Submit transactions lên blockchain

### WebSocket Service

- Real-time updates cho web và game client
- Push notifications: new rewards, quest completions, etc.

## Game Client Integration

### Authentication Flow

1. User login trên web → Get JWT token
2. Game client nhận JWT token
3. Game client verify token với API
4. Load user's active character và bike

### Character Loading

1. Query character NFT metadata từ API
2. Load 3D model parts (eyes, nose, mouth, etc.)
3. Assemble character model
4. Load animations (5 actions)

### Race Flow

1. User chọn map và start race
2. Game client gửi `start_race` request → API
3. API tạo race record và return race_id
4. User chơi race trong game
5. Game client submit result → API
6. API validate và submit lên blockchain
7. Rewards được distribute

## Data Flow Examples

### Character Creation Flow

```
Web (React)
  → POST /characters/create {metadata}
  → NestJS API
  → Substrate RPC: pallet_nft::mint_character()
  → Blockchain Event: CharacterMinted
  → Go Indexer: Sync to PostgreSQL
  → WebSocket: Notify user
  → Web: Display new NFT
```

### Race Completion Flow

```
Game Client (C++)
  → POST /races/:id/result {time, position}
  → NestJS API
  → Go Game Service: Validate & calculate rewards
  → Substrate RPC: pallet_race::submit_race_result()
  → Blockchain Event: RaceCompleted
  → Go Indexer: Update race record
  → Substrate RPC: pallet_rewards::distribute_reward()
  → WebSocket: Notify user of rewards
```

## Security Considerations

1. **Wallet Signature Verification**: Verify wallet signatures cho authentication
2. **Race Result Validation**: Validate race results để tránh cheating
3. **Rate Limiting**: Limit API calls để tránh spam
4. **JWT Expiration**: Short-lived JWT tokens
5. **On-chain Validation**: Critical operations phải được validate on-chain

## Scalability

1. **Database Indexing**: Index các columns thường query (user_id, nft_id, etc.)
2. **Caching**: Redis cache cho frequently accessed data
3. **Load Balancing**: Multiple API instances
4. **CDN**: Static assets và game client distribution
5. **Blockchain Scaling**: Consider parachain nếu cần higher throughput

## Next Steps

1. Setup project structure
2. Implement blockchain pallets
3. Setup database schema
4. Implement API layer
5. Implement Go services
6. Build web frontend
7. Integrate game client
8. Testing & deployment
