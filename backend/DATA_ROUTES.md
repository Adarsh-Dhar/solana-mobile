# On-Chain Data Routes

This document describes the implementation of on-chain data routes for the Solana dating app.

## Environment Variables Required

Add these to your `.env` file:

```env
# JWT Secret for authentication
JWT_SECRET="your-super-secret-jwt-key-here"

# Helius API for Solana blockchain data
HELIUS_API_KEY="your-helius-api-key-here"
```

## API Endpoints

### 1. POST /api/data/refresh
**Purpose**: Manually trigger on-chain data refresh

**Headers**: 
```
Authorization: Bearer <jwt-token>
```

**Response**:
```json
{
  "jobId": "refresh-1234567890-abc123",
  "status": "queued",
  "message": "Wallet data refresh job started"
}
```

**Workflow**:
- Queues background job to fetch latest data from Helius
- Recalculates wallet analysis
- Updates compatibility scores for all matches
- Notifies via WebSocket when complete (TODO)

### 2. GET /api/data/wallet-snapshot
**Purpose**: Get real-time wallet summary

**Headers**: 
```
Authorization: Bearer <jwt-token>
```

**Response**:
```json
{
  "solBalance": 12.4,
  "bonkBalance": 5000000,
  "lastActivity": "2025-07-12T14:30:00Z",
  "liveReputation": 0.92,
  "nftCount": 5,
  "walletAge": "2024-01-15T10:30:00Z",
  "defiActivity": ["jito", "marginfi"]
}
```

**Workflow**:
- Fetches live balance via Helius RPC
- Checks recent transactions
- Calculates instant reputation score
- Returns real-time wallet data

### 3. GET /api/data/refresh-status/:jobId
**Purpose**: Check status of refresh job

**Headers**: 
```
Authorization: Bearer <jwt-token>
```

**Response**:
```json
{
  "jobId": "refresh-1234567890-abc123",
  "status": "completed",
  "createdAt": "2025-07-12T14:30:00Z",
  "completedAt": "2025-07-12T14:32:00Z"
}
```

## Authentication

All endpoints require JWT authentication. Get a token by:

1. Register: `POST /api/auth/register`
2. Login: `POST /api/auth/login`

Include the token in the Authorization header: `Bearer <token>`

## Background Jobs

The refresh endpoint uses an in-memory job queue. In production, consider using:
- Redis for job storage
- Bull/BullMQ for job processing
- WebSocket for real-time notifications

## Helius Integration

The routes use Helius RPC endpoints to fetch:
- Account information (SOL balance)
- Token accounts (BONK, NFTs, etc.)
- Recent transactions
- Wallet activity patterns

## Reputation Scoring

The system calculates reputation scores based on:
- Wallet age
- NFT holdings
- DeFi activity
- Airdrops received
- Rug count (penalty)

## Database Schema

Uses the Prisma schema with:
- `User` model with wallet analysis
- `WalletAnalysis` for on-chain metrics
- `Match` for compatibility scoring
- `Preferences` for user preferences

## Error Handling

All endpoints include proper error handling:
- 401: Authentication required
- 403: Invalid token
- 404: User/Job not found
- 500: Internal server error

## Development

To run the backend:

```bash
cd backend
npm install
npm run dev
```

Make sure to set up your environment variables and have a PostgreSQL database running. 