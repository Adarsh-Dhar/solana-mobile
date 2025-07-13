# Token Economy Feature

## Overview

The Token Economy feature enables users to purchase, spend, transfer, and manage dating tokens within the Solana mobile dating app. The system integrates with Solana blockchain for payments, NFT voucher minting, and secure token balance management.

## Features

### 💰 Core Functionality
- **Token Purchase**: Buy dating tokens with USDC, SOL, or BONK
- **Token Spending**: Use tokens for app features (date suggestions, etc.)
- **Token Transfer**: Send tokens to other users
- **Balance Management**: Track and manage token balances
- **Transaction History**: View complete token transaction history
- **Voucher NFTs**: Receive NFT receipts for token purchases

### 🔗 Blockchain Integration
- **Solana Pay**: Seamless payment processing
- **NFT Vouchers**: On-chain proof of token purchases
- **Multi-Currency Support**: USDC, SOL, BONK payments
- **Transaction Verification**: On-chain payment confirmation

### 📱 User Experience
- **Real-time Balances**: Instant balance updates
- **Transaction History**: Complete audit trail
- **Voucher Collection**: NFT receipts for purchases
- **Price Transparency**: Real-time token pricing

## API Endpoints

### Token Purchase
```http
POST /api/tokens/purchase
Authorization: Bearer <token>

{
  "amount": 5,
  "currency": "USDC",
  "wallet": "7sP..."
}
```

### Get Balance
```http
GET /api/tokens/balance
Authorization: Bearer <token>
```

### Spend Tokens
```http
POST /api/tokens/spend
Authorization: Bearer <token>

{
  "amount": 1,
  "purpose": "Date suggestion",
  "referenceId": "date-789"
}
```

### Transfer Tokens
```http
POST /api/tokens/transfer
Authorization: Bearer <token>

{
  "recipientId": "user-456",
  "amount": 2,
  "message": "Thanks for the great date!"
}
```

## Token Pricing

| Currency | Tokens per Unit | Unit Price | Example |
|----------|----------------|------------|---------|
| USDC | 10 tokens | 0.1 USDC | 1 USDC = 10 tokens |
| SOL | 100 tokens | 0.01 SOL | 1 SOL = 100 tokens |
| BONK | 10000 tokens | 0.0001 BONK | 1 BONK = 10000 tokens |

## Setup Instructions

### 1. Environment Variables

Add these to your `.env` file:

```env
# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_PRIVATE_KEY=your_private_key_here
DATING_APP_WALLET=your_app_wallet_address

# Price Oracle
JUPITER_API_KEY=your_jupiter_api_key
COINGECKO_API_KEY=your_coingecko_api_key

# NFT Storage
NFT_STORAGE_API_KEY=your_nft_storage_key

# Database
DATABASE_URL=your_database_url
```

### 2. Dependencies

Install required packages:

```bash
npm install @solana/web3.js @solana/spl-token
npm install @solana/pay
npm install axios
npm install ipfs-http-client
```

### 3. Database Schema

Add token-related tables to your Prisma schema:

```prisma
model TokenBalance {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  balance   Int      @default(0)
  currency  String   @default("DATING_TOKENS")
  updatedAt DateTime @updatedAt
}

model TokenTransaction {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  type        String   // PURCHASE, SPEND, TRANSFER_SENT, TRANSFER_RECEIVED
  amount      Int
  currency    String
  balance     Int
  purpose     String?
  referenceId String?
  txSignature String?
  createdAt   DateTime @default(now())
}

model VoucherNFT {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  voucherId   String   @unique
  nftAddress  String
  amount      Int
  currency    String
  metadata    Json
  ipfsHash    String
  status      String   @default("ACTIVE")
  createdAt   DateTime @default(now())
}
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name add_token_economy
npx prisma generate
```

## Integration Points

### Solana Blockchain Integration

The following functions need to be implemented with actual Solana SDK:

#### Solana Pay Integration
```javascript
const { SolanaPay } = require('@solana/pay');

const initiateSolanaPayTransaction = async (amount, currency, walletAddress) => {
  const paymentRequest = new SolanaPay({
    recipient: process.env.DATING_APP_WALLET,
    amount: amount * 0.1, // Convert to SOL
    currency: currency,
    reference: `dating_tokens_${Date.now()}`
  });
  
  return {
    paymentUrl: paymentRequest.getUrl(),
    transaction: paymentRequest.getTransaction()
  };
};
```

#### Transaction Verification
```javascript
const { Connection, PublicKey } = require('@solana/web3.js');

const confirmPaymentOnChain = async (txSignature, expectedAmount) => {
  const connection = new Connection(process.env.SOLANA_RPC_URL);
  const transaction = await connection.getTransaction(txSignature);
  
  // Verify transaction details
  return {
    confirmed: transaction !== null,
    amount: transaction?.meta?.postBalances[0] || 0,
    timestamp: transaction?.blockTime
  };
};
```

#### NFT Minting
```javascript
const { createMint, createAccount, mintTo } = require('@solana/spl-token');

const mintVoucherNFT = async (userId, amount, currency, txSignature) => {
  // Mint NFT with metadata
  const metadata = {
    name: `Dating Tokens Voucher - ${amount} tokens`,
    description: `Voucher for ${amount} dating tokens purchased with ${currency}`,
    attributes: [
      { trait_type: "Token Amount", value: amount },
      { trait_type: "Currency", value: currency },
      { trait_type: "Transaction", value: txSignature }
    ]
  };
  
  // Upload to IPFS and mint NFT
  return { voucherId, nftAddress, metadata };
};
```

### Price Oracle Integration

Integrate with price feeds:

```javascript
const getTokenPrices = async () => {
  // Jupiter Price API
  const jupiterPrices = await axios.get('https://price.jup.ag/v4/price');
  
  // CoinGecko API
  const coingeckoPrices = await axios.get('https://api.coingecko.com/api/v3/simple/price');
  
  return {
    USDC: { tokensPerUnit: 10, unitPrice: 0.1 },
    SOL: { tokensPerUnit: 100, unitPrice: 0.01 },
    BONK: { tokensPerUnit: 10000, unitPrice: 0.0001 }
  };
};
```

## Testing

### Run Tests

```bash
# Start the server
npm run dev

# In another terminal, run tests
node test-tokens.js
```

### Manual Testing

1. **Purchase tokens** using different currencies
2. **Check balance** after purchase
3. **Spend tokens** on app features
4. **Transfer tokens** to other users
5. **View transaction history**
6. **Check voucher NFTs**

### Test Data

```javascript
// Example test data
const testPurchase = {
  amount: 5,
  currency: 'USDC',
  wallet: '7sP123456789012345678901234567890123456789'
};

const testSpend = {
  amount: 1,
  purpose: 'Date suggestion',
  referenceId: 'date-789'
};
```

## Security Considerations

### Payment Security
- Verify transaction signatures
- Check payment amounts match expected values
- Validate recipient addresses
- Prevent double-spending
- Implement rate limiting

### Balance Management
- Atomic balance updates
- Prevent negative balances
- Handle concurrent transactions
- Implement balance locking
- Transaction rollback on failure

### Fraud Prevention
- Rate limiting on purchases
- Suspicious activity detection
- Transaction monitoring
- Automated fraud detection
- IP-based restrictions

### Data Privacy
- Encrypt sensitive transaction data
- Implement data retention policies
- GDPR compliance for user data
- Secure wallet address storage
- Anonymize transaction data

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Insufficient balance` | User doesn't have enough tokens | Add more tokens to account |
| `Invalid wallet address` | Malformed Solana address | Check address format |
| `Payment confirmation failed` | Transaction not found on-chain | Retry payment |
| `Unsupported currency` | Currency not in supported list | Use USDC, SOL, or BONK |
| `Amount out of range` | Amount too high or low | Use 1-100 tokens |

### Debugging

Enable debug logging:

```javascript
// In your .env file
DEBUG=tokens:*
LOG_LEVEL=debug
```

## Performance Optimization

### Database Indexes

Add these indexes to your Prisma schema:

```prisma
model TokenTransaction {
  // ... existing fields ...
  
  @@index([userId])
  @@index([type])
  @@index([createdAt])
  @@index([txSignature])
}

model VoucherNFT {
  // ... existing fields ...
  
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}
```

### Caching

Implement Redis caching for frequently accessed data:

```javascript
const cache = require('redis');
const client = cache.createClient();

const getCachedBalance = async (userId) => {
  const cached = await client.get(`balance:${userId}`);
  if (cached) return JSON.parse(cached);
  
  const balance = await getUserTokenBalance(userId);
  await client.setex(`balance:${userId}`, 300, JSON.stringify(balance));
  return balance;
};
```

## Monitoring

### Key Metrics

- Token purchase success rate
- Average purchase amount
- Most popular currencies
- Transfer volume
- Voucher NFT minting success rate
- Balance update performance
- Transaction verification time

### Alerts

- Failed payment confirmations
- Insufficient balance errors
- High transaction volumes
- Price oracle failures
- NFT minting failures
- Database connection issues

### Logging

```javascript
const logger = require('winston');

logger.info('Token purchase completed', {
  userId,
  amount,
  currency,
  txSignature,
  newBalance
});
```

## Future Enhancements

### Planned Features

1. **Token Staking**: Earn rewards by staking tokens
2. **Token Burning**: Burn tokens for special features
3. **Token Airdrops**: Distribute tokens to active users
4. **Token Governance**: Community voting with tokens
5. **Token Marketplace**: Trade tokens between users
6. **Token Rewards**: Earn tokens for app engagement
7. **Token Tiers**: Different token tiers with benefits

### Blockchain Enhancements

1. **Smart Contracts**: Automated token management
2. **Cross-chain Support**: Multi-chain token bridges
3. **DeFi Integration**: Yield farming for tokens
4. **DAO Governance**: Community-driven token economics
5. **Token Vesting**: Time-locked token releases
6. **Token Inflation**: Controlled token supply growth

## Support

For issues and questions:

1. Check the [API Documentation](./TOKEN_ECONOMY_API.md)
2. Review the [test files](./test-tokens.js)
3. Check the [database schema](../prisma/schema.prisma)
4. Contact the development team

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

This feature is part of the Solana Mobile Dating App project. 