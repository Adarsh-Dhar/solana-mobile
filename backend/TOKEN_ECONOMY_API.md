# Token Economy API Documentation

## Overview

The Token Economy API provides endpoints for purchasing, spending, transferring, and managing dating tokens. The system integrates with Solana blockchain for payments, NFT voucher minting, and token balance management.

## Authentication

All endpoints require Bearer token authentication:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. POST /api/tokens/purchase

**Purpose**: Buy dating tokens using various cryptocurrencies.

**Headers**: 
- `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "amount": 5,
  "currency": "USDC",
  "wallet": "7sP..."
}
```

**Supported Currencies**:
- `USDC` - USD Coin
- `SOL` - Solana
- `BONK` - Bonk token

**Workflow**:
1. Validate payment amount and currency
2. Initiate Solana Pay transaction
3. Confirm payment on-chain
4. Update user token balance
5. Mint voucher NFT receipt

**Response**:
```json
{
  "txSignature": "3tH...",
  "newBalance": 10,
  "voucherNft": "DqW...",
  "paymentDetails": {
    "amount": 5,
    "currency": "USDC",
    "wallet": "7sP...",
    "timestamp": "2025-07-15T10:30:00Z"
  },
  "voucherMetadata": {
    "name": "Dating Tokens Voucher - 5 tokens",
    "description": "Voucher for 5 dating tokens purchased with USDC",
    "image": "ipfs://Qm.../voucher.json",
    "attributes": [
      { "trait_type": "Token Amount", "value": 5 },
      { "trait_type": "Currency", "value": "USDC" },
      { "trait_type": "Purchase Date", "value": "2025-07-15T10:30:00Z" },
      { "trait_type": "Transaction", "value": "3tH..." }
    ]
  }
}
```

### 2. GET /api/tokens/balance

**Purpose**: Get user's current token balance.

**Headers**: 
- `Authorization: Bearer <token>`

**Response**:
```json
{
  "userId": "user-123",
  "balance": 10,
  "currency": "DATING_TOKENS",
  "lastUpdated": "2025-07-15T10:30:00Z"
}
```

### 3. POST /api/tokens/spend

**Purpose**: Spend dating tokens for app features (date suggestions, etc.).

**Headers**: 
- `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "amount": 1,
  "purpose": "Date suggestion",
  "referenceId": "date-789"
}
```

**Response**:
```json
{
  "success": true,
  "previousBalance": 10,
  "newBalance": 9,
  "amountSpent": 1,
  "purpose": "Date suggestion",
  "referenceId": "date-789",
  "timestamp": "2025-07-15T10:30:00Z"
}
```

### 4. GET /api/tokens/history

**Purpose**: Get user's token transaction history.

**Headers**: 
- `Authorization: Bearer <token>`

**Query Parameters**:
- `limit` (optional): Number of transactions to return (1-100, default: 20)
- `offset` (optional): Number of transactions to skip (default: 0)

**Response**:
```json
{
  "userId": "user-123",
  "transactions": [
    {
      "id": "tx-1",
      "type": "PURCHASE",
      "amount": 5,
      "currency": "USDC",
      "balance": 10,
      "timestamp": "2025-07-14T10:30:00Z",
      "reference": "dating_tokens_1234567890",
      "voucherNft": "DqW123456789"
    },
    {
      "id": "tx-2",
      "type": "SPEND",
      "amount": -1,
      "currency": "DATING_TOKENS",
      "balance": 9,
      "timestamp": "2025-07-15T09:30:00Z",
      "purpose": "Date suggestion",
      "referenceId": "date-789"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### 5. GET /api/tokens/vouchers

**Purpose**: Get user's voucher NFTs from token purchases.

**Headers**: 
- `Authorization: Bearer <token>`

**Response**:
```json
{
  "userId": "user-123",
  "vouchers": [
    {
      "voucherId": "DqW123456789",
      "nftAddress": "DqW123456789",
      "amount": 5,
      "currency": "USDC",
      "purchaseDate": "2025-07-14T10:30:00Z",
      "metadata": {
        "name": "Dating Tokens Voucher - 5 tokens",
        "description": "Voucher for 5 dating tokens purchased with USDC",
        "image": "ipfs://Qm123456789/voucher.json"
      },
      "status": "ACTIVE"
    }
  ],
  "totalVouchers": 1
}
```

### 6. POST /api/tokens/transfer

**Purpose**: Transfer tokens to another user.

**Headers**: 
- `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "recipientId": "user-456",
  "amount": 2,
  "message": "Thanks for the great date!"
}
```

**Response**:
```json
{
  "success": true,
  "transfer": {
    "senderId": "user-123",
    "recipientId": "user-456",
    "recipientUsername": "crypto_user_456",
    "amount": 2,
    "message": "Thanks for the great date!",
    "timestamp": "2025-07-15T10:30:00Z"
  },
  "senderBalance": {
    "previous": 9,
    "new": 7
  },
  "recipientBalance": {
    "previous": 5,
    "new": 7
  }
}
```

### 7. GET /api/tokens/prices

**Purpose**: Get current token prices in different currencies.

**Response**:
```json
{
  "prices": {
    "USDC": {
      "tokensPerUnit": 10,
      "unitPrice": 0.1,
      "currency": "USDC"
    },
    "SOL": {
      "tokensPerUnit": 100,
      "unitPrice": 0.01,
      "currency": "SOL"
    },
    "BONK": {
      "tokensPerUnit": 10000,
      "unitPrice": 0.0001,
      "currency": "BONK"
    }
  },
  "lastUpdated": "2025-07-15T10:30:00Z",
  "supportedCurrencies": ["USDC", "SOL", "BONK"]
}
```

## Token Pricing

| Currency | Tokens per Unit | Unit Price | Example |
|----------|----------------|------------|---------|
| USDC | 10 tokens | 0.1 USDC | 1 USDC = 10 tokens |
| SOL | 100 tokens | 0.01 SOL | 1 SOL = 100 tokens |
| BONK | 10000 tokens | 0.0001 BONK | 1 BONK = 10000 tokens |

## Transaction Types

| Type | Description | Amount | Example |
|------|-------------|--------|---------|
| `PURCHASE` | Token purchase | Positive | +5 tokens |
| `SPEND` | Token spending | Negative | -1 token |
| `TRANSFER_SENT` | Outgoing transfer | Negative | -2 tokens |
| `TRANSFER_RECEIVED` | Incoming transfer | Positive | +2 tokens |
| `REFUND` | Purchase refund | Positive | +5 tokens |

## Error Responses

### 400 Bad Request
```json
{
  "error": "Amount must be between 1 and 100 tokens",
  "errors": [
    {
      "type": "field",
      "value": 150,
      "msg": "Amount must be between 1 and 100 tokens",
      "path": "amount",
      "location": "body"
    }
  ]
}
```

### 400 Insufficient Balance
```json
{
  "error": "Insufficient token balance",
  "currentBalance": 5,
  "requiredAmount": 10
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 404 Not Found
```json
{
  "error": "Recipient not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to process token purchase"
}
```

## Integration Points

### Solana Blockchain Integration

The following functions need to be implemented with actual Solana SDK:

1. **Solana Pay Integration** (`initiateSolanaPayTransaction`)
   - Generate payment URLs
   - Create transaction messages
   - Handle multiple currencies

2. **Transaction Verification** (`confirmPaymentOnChain`)
   - Verify transaction signatures
   - Check payment amounts
   - Validate recipient addresses

3. **NFT Minting** (`mintVoucherNFT`)
   - Mint voucher NFTs on Solana
   - Upload metadata to IPFS
   - Link NFTs to user wallets

4. **Token Balance Management**
   - Store balances on-chain or in database
   - Handle atomic balance updates
   - Implement balance locking

### Price Oracle Integration

The `getTokenPrices` function should integrate with:
- Jupiter Price API
- CoinGecko API
- Pyth Network
- Real-time price feeds

### Wallet Integration

Token operations should support:
- Phantom Wallet
- Solflare Wallet
- Backpack Wallet
- Hardware wallets

## Security Considerations

1. **Payment Verification**
   - Verify transaction signatures
   - Check payment amounts match expected values
   - Validate recipient addresses
   - Prevent double-spending

2. **Balance Management**
   - Atomic balance updates
   - Prevent negative balances
   - Handle concurrent transactions
   - Implement balance locking

3. **Fraud Prevention**
   - Rate limiting on purchases
   - Suspicious activity detection
   - Transaction monitoring
   - Automated fraud detection

4. **Data Privacy**
   - Encrypt sensitive transaction data
   - Implement data retention policies
   - GDPR compliance for user data
   - Secure wallet address storage

## Testing

### Unit Tests
- Token purchase validation
- Balance update calculations
- Payment verification
- NFT minting simulation

### Integration Tests
- End-to-end purchase flow
- Blockchain transaction verification
- Wallet integration testing
- Price oracle integration

### Load Tests
- Concurrent token purchases
- High-volume balance updates
- NFT minting performance
- Database transaction handling

## Monitoring

### Key Metrics
- Token purchase success rate
- Average purchase amount
- Most popular currencies
- Transfer volume
- Voucher NFT minting success rate

### Alerts
- Failed payment confirmations
- Insufficient balance errors
- High transaction volumes
- Price oracle failures

## Future Enhancements

### Planned Features
1. **Token Staking**: Earn rewards by staking tokens
2. **Token Burning**: Burn tokens for special features
3. **Token Airdrops**: Distribute tokens to active users
4. **Token Governance**: Community voting with tokens
5. **Token Marketplace**: Trade tokens between users

### Blockchain Enhancements
1. **Smart Contracts**: Automated token management
2. **Cross-chain Support**: Multi-chain token bridges
3. **DeFi Integration**: Yield farming for tokens
4. **DAO Governance**: Community-driven token economics 