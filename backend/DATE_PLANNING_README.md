# Date Planning Feature

## Overview

The Date Planning feature enables matched users to suggest, confirm, and verify dates through a blockchain-integrated system. The feature includes NFT minting, escrow management, and POAP distribution for completed dates.

## Features

### 🎯 Core Functionality
- **Date Suggestions**: Propose dates with location types and custom details
- **Date Confirmation**: Confirm date details and mint Date NFTs
- **Date Verification**: Verify dates via geolocation and timestamp
- **NFT Integration**: On-chain proof of dates and commemorative POAPs
- **Escrow System**: Secure funding for confirmed dates
- **Calendar Integration**: Add dates to shared calendars

### 🔗 Blockchain Integration
- **Date NFTs**: Minted when dates are confirmed
- **POAPs**: Commemorative tokens for completed dates
- **Escrow**: Secure funding mechanism
- **Token System**: Dating token balance management

### 📱 User Experience
- **Push Notifications**: Real-time updates for date events
- **In-App Notifications**: Internal notification system
- **Calendar Events**: iCal integration for date scheduling
- **Geolocation Verification**: GPS-based date completion proof

## API Endpoints

### Date Suggestion
```http
POST /api/dates/suggest
Authorization: Bearer <token>

{
  "matchId": "match-123",
  "locationType": "NFT_GALLERY",
  "customDetails": "Meet at Degenerate Ape Gallery",
  "proposedTime": "2025-07-20T19:30:00Z",
  "location": "123 Main St, San Francisco, CA"
}
```

### Date Confirmation
```http
POST /api/dates/:dateId/confirm
Authorization: Bearer <token>

{
  "confirmedTime": "2025-07-20T19:30:00Z",
  "confirmedLocation": "123 Main St, San Francisco, CA",
  "additionalDetails": "Meet at the entrance at 7:30 PM"
}
```

### Date Verification
```http
POST /api/dates/:dateId/verify
Authorization: Bearer <token>

{
  "coordinates": [37.7749, -122.4194],
  "timestamp": "2025-07-20T19:30:00Z"
}
```

## Location Types

| Type | Description | Example |
|------|-------------|---------|
| `NFT_GALLERY` | NFT gallery or museum | Degenerate Ape Gallery |
| `CRYPTO_CAFE` | Cryptocurrency-themed cafe | Bitcoin Cafe |
| `BLOCKCHAIN_EVENT` | Blockchain conference or meetup | Solana Breakpoint |
| `DEFI_MEETUP` | DeFi community event | DeFi Summit |
| `CUSTOM` | Custom location/activity | Private dinner |

## Date Status Flow

```
PROPOSED → CONFIRMED → COMPLETED
    ↓         ↓          ↓
  Suggestion → NFT Mint → POAP + Escrow Release
```

## Setup Instructions

### 1. Database Setup

Ensure your Prisma schema includes the `DateSuggestion` model:

```prisma
model DateSuggestion {
  id                String    @id @default(uuid())
  createdAt         DateTime  @default(now())
  
  // Related entities
  matchId           String
  match             Match     @relation(fields: [matchId], references: [id])
  suggestedById     String?
  suggestedBy       User?     @relation(fields: [suggestedById], references: [id])
  
  // Date details
  title             String
  description       String?
  location          String
  time              DateTime?
  onchainReference  String?
  status            DateStatus @default(PROPOSED)
}

enum DateStatus {
  PROPOSED
  CONFIRMED
  COMPLETED
  CANCELLED
}
```

### 2. Environment Variables

Add these to your `.env` file:

```env
# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_PRIVATE_KEY=your_private_key_here

# NFT Storage (IPFS)
NFT_STORAGE_API_KEY=your_nft_storage_key

# Push Notifications
FIREBASE_SERVER_KEY=your_firebase_key
APNS_KEY_ID=your_apns_key_id
APNS_TEAM_ID=your_apns_team_id

# Calendar Integration
GOOGLE_CALENDAR_API_KEY=your_google_api_key
```

### 3. Dependencies

Install required packages:

```bash
npm install @solana/web3.js @solana/spl-token
npm install firebase-admin
npm install node-cron
npm install axios
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name add_date_suggestions
npx prisma generate
```

## Integration Points

### Solana Blockchain Integration

The following functions need to be implemented with actual Solana SDK:

#### Token Balance Check
```javascript
const validateDatingTokens = async (userId, requiredTokens = 1) => {
  // TODO: Implement with @solana/web3.js
  // Check user's dating token balance
  // Deduct tokens for date suggestions
};
```

#### NFT Minting
```javascript
const mintDateNFT = async (dateDetails, participants) => {
  // TODO: Implement with @solana/web3.js
  // Mint confirmed date NFTs with metadata
  // Update NFT metadata on completion
};
```

#### Escrow Management
```javascript
const createEscrow = async (dateId, amount) => {
  // TODO: Implement with @solana/web3.js
  // Lock funds for confirmed dates
  // Release funds on completion
};
```

### Push Notifications

Integrate with Firebase Cloud Messaging:

```javascript
const sendNotification = async (userId, title, body, data = {}) => {
  // TODO: Implement with firebase-admin
  // Send push notifications to users
};
```

### Calendar Integration

Generate iCal events:

```javascript
const generateCalendarEvent = (dateId, dateDetails) => {
  // TODO: Implement iCal generation
  // Create calendar event for confirmed dates
};
```

## Testing

### Run Tests

```bash
# Start the server
npm run dev

# In another terminal, run tests
node test-dates.js
```

### Manual Testing

1. **Create a match** using the matches API
2. **Suggest a date** using the dates API
3. **Confirm the date** with details
4. **Verify the date** with geolocation
5. **Check the results** in the database

### Test Data

```javascript
// Example test data
const testDate = {
  matchId: "match-123",
  locationType: "NFT_GALLERY",
  customDetails: "Meet at Degenerate Ape Gallery",
  proposedTime: "2025-07-20T19:30:00Z",
  location: "123 Main St, San Francisco, CA"
};
```

## Security Considerations

### Geolocation Verification
- Use GPS accuracy metrics
- Implement anti-spoofing measures
- Consider venue-specific coordinates
- Validate timestamp windows

### Authorization
- Validate user participation in matches
- Check date ownership before operations
- Implement rate limiting
- Verify token balances

### Data Privacy
- Encrypt sensitive date details
- Implement data retention policies
- GDPR compliance for user data
- Secure NFT metadata

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Match not found` | Invalid match ID | Verify match exists and user is participant |
| `Insufficient tokens` | Low token balance | Add more dating tokens to user account |
| `Location verification failed` | GPS coordinates too far | Check venue coordinates and radius |
| `Timestamp validation failed` | Time outside window | Verify timestamp is within 2 hours of scheduled time |

### Debugging

Enable debug logging:

```javascript
// In your .env file
DEBUG=dates:*
LOG_LEVEL=debug
```

## Performance Optimization

### Database Indexes

Add these indexes to your Prisma schema:

```prisma
model DateSuggestion {
  // ... existing fields ...
  
  @@index([matchId])
  @@index([suggestedById])
  @@index([status])
  @@index([createdAt])
}
```

### Caching

Implement Redis caching for frequently accessed data:

```javascript
const cache = require('redis');
const client = cache.createClient();

const getCachedDate = async (dateId) => {
  const cached = await client.get(`date:${dateId}`);
  if (cached) return JSON.parse(cached);
  
  const date = await prisma.dateSuggestion.findUnique({
    where: { id: dateId }
  });
  
  await client.setex(`date:${dateId}`, 3600, JSON.stringify(date));
  return date;
};
```

## Monitoring

### Metrics to Track

- Date suggestion success rate
- Confirmation rate
- Verification success rate
- NFT minting success rate
- Escrow release success rate
- Geolocation accuracy

### Logging

```javascript
const logger = require('winston');

logger.info('Date suggested', {
  dateId,
  matchId,
  locationType,
  suggestedBy: userId
});
```

## Future Enhancements

### Planned Features

1. **Date Cancellation**: Allow users to cancel confirmed dates
2. **Rescheduling**: Modify confirmed date details
3. **Group Dates**: Support for multiple participants
4. **Date Templates**: Pre-defined date suggestions
5. **Venue Integration**: Partner with real venues
6. **AI Suggestions**: ML-powered date recommendations

### Blockchain Enhancements

1. **Smart Contracts**: Automated escrow management
2. **DAO Governance**: Community-driven date rules
3. **Cross-chain Support**: Multi-chain date NFTs
4. **DeFi Integration**: Yield farming for date funds

## Support

For issues and questions:

1. Check the [API Documentation](./DATE_PLANNING_API.md)
2. Review the [test files](./test-dates.js)
3. Check the [database schema](../prisma/schema.prisma)
4. Contact the development team

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

This feature is part of the Solana Mobile Dating App project. 