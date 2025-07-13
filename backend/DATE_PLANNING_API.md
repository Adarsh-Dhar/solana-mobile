# Date Planning API Documentation

## Overview

The Date Planning API provides endpoints for suggesting, confirming, and verifying dates between matched users. The system integrates with Solana blockchain for NFT minting, escrow management, and POAP distribution.

## Authentication

All endpoints require Bearer token authentication:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. POST /api/dates/suggest

**Purpose**: Suggest a date location/activity to a matched user.

**Headers**: 
- `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "matchId": "match-123",
  "locationType": "NFT_GALLERY",
  "customDetails": "Meet at Degenerate Ape Gallery",
  "proposedTime": "2025-07-20T19:30:00Z",
  "location": "123 Main St, San Francisco, CA"
}
```

**Location Types**:
- `NFT_GALLERY` - NFT gallery or museum
- `CRYPTO_CAFE` - Cryptocurrency-themed cafe
- `BLOCKCHAIN_EVENT` - Blockchain conference or meetup
- `DEFI_MEETUP` - DeFi community event
- `CUSTOM` - Custom location/activity

**Workflow**:
1. Validate match exists and user is participant
2. Check user has sufficient dating tokens
3. Create date proposal record
4. Generate on-chain proof (NFT placeholder)
5. Send in-app notification to other user

**Response**:
```json
{
  "dateId": "date-789",
  "proposalStatus": "PENDING",
  "dateNftPreview": "ipfs://Qm...date-preview.json",
  "title": "NFT Gallery Meetup",
  "description": "Meet at Degenerate Ape Gallery",
  "locationType": "NFT_GALLERY",
  "suggestedBy": "crypto_user_123"
}
```

### 2. POST /api/dates/:dateId/confirm

**Purpose**: Confirm date details and mint finalized Date NFT.

**Headers**: 
- `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "confirmedTime": "2025-07-20T19:30:00Z",
  "confirmedLocation": "123 Main St, San Francisco, CA",
  "additionalDetails": "Meet at the entrance at 7:30 PM"
}
```

**Workflow**:
1. Validate date suggestion exists and user is participant
2. Update date status to CONFIRMED
3. Mint finalized Date NFT with encrypted details
4. Create on-chain proof of date commitment
5. Initiate escrow for date funding
6. Add to shared calendar
7. Send notifications to both participants

**Response**:
```json
{
  "txSignature": "5sx...",
  "nftAddress": "FvK...",
  "calendarEvent": "webcal://dates.dinetimeyt.com/event/date-789",
  "escrowAddress": "Esc...",
  "confirmedTime": "2025-07-20T19:30:00Z",
  "confirmedLocation": "123 Main St, San Francisco, CA"
}
```

### 3. POST /api/dates/:dateId/verify

**Purpose**: Verify date occurred via geolocation and timestamp.

**Headers**: 
- `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "coordinates": [37.7749, -122.4194],
  "timestamp": "2025-07-20T19:30:00Z"
}
```

**Workflow**:
1. Validate user is participant in confirmed date
2. Compare location with venue coordinates (100m radius)
3. Validate timestamp window (within 2 hours of scheduled time)
4. If confirmed:
   - Update date status to COMPLETED
   - Unlock date NFT metadata
   - Release escrowed funds
   - Mint commemorative POAP
   - Send completion notifications

**Response**:
```json
{
  "verificationStatus": "CONFIRMED",
  "poapMintAddress": "8yT...",
  "unlockedMetadata": {
    "status": "COMPLETED",
    "verificationTime": "2025-07-20T19:30:00Z",
    "coordinates": [37.7749, -122.4194]
  },
  "releasedFunds": {
    "status": "RELEASED",
    "amount": 0.1,
    "txSignature": "rel..."
  },
  "completionTime": "2025-07-20T19:30:00Z"
}
```

### 4. GET /api/dates/:dateId

**Purpose**: Get detailed information about a specific date.

**Headers**: 
- `Authorization: Bearer <token>`

**Response**:
```json
{
  "id": "date-789",
  "title": "NFT Gallery Meetup",
  "description": "Meet at Degenerate Ape Gallery",
  "location": "123 Main St, San Francisco, CA",
  "time": "2025-07-20T19:30:00Z",
  "status": "CONFIRMED",
  "suggestedBy": "crypto_user_123",
  "participants": ["crypto_user_123", "nft_collector_456"],
  "matchId": "match-123"
}
```

### 5. GET /api/dates/match/:matchId

**Purpose**: Get all dates for a specific match.

**Headers**: 
- `Authorization: Bearer <token>`

**Response**:
```json
[
  {
    "id": "date-789",
    "title": "NFT Gallery Meetup",
    "description": "Meet at Degenerate Ape Gallery",
    "location": "123 Main St, San Francisco, CA",
    "time": "2025-07-20T19:30:00Z",
    "status": "CONFIRMED",
    "suggestedBy": {
      "id": "user-123",
      "username": "crypto_user_123",
      "profilePicture": "https://..."
    },
    "createdAt": "2025-07-15T10:30:00Z"
  }
]
```

## Date Status Flow

1. **PROPOSED** - Initial date suggestion
2. **CONFIRMED** - Both users agreed to date details
3. **COMPLETED** - Date verified via geolocation
4. **CANCELLED** - Date was cancelled (not implemented yet)

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid match ID",
  "errors": [
    {
      "type": "field",
      "value": "invalid-uuid",
      "msg": "Invalid match ID",
      "path": "matchId",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Not authorized to confirm this date"
}
```

### 404 Not Found
```json
{
  "error": "Match not found or not accepted"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to suggest date"
}
```

## Integration Points

### Solana Blockchain Integration

The following functions need to be implemented with actual Solana SDK:

1. **Token Balance Check** (`validateDatingTokens`)
   - Check user's dating token balance
   - Deduct tokens for date suggestions

2. **NFT Minting** (`generateOnChainProof`, `mintDateNFT`)
   - Mint date proposal NFTs
   - Mint confirmed date NFTs with metadata
   - Update NFT metadata on completion

3. **Escrow Management** (`createEscrow`)
   - Lock funds for confirmed dates
   - Release funds on completion
   - Handle partial refunds for cancellations

4. **POAP Minting** (`mintPOAP`)
   - Mint commemorative POAPs for completed dates
   - Include date metadata in POAP

### Push Notifications

The `sendNotification` function should integrate with:
- Firebase Cloud Messaging (FCM)
- Apple Push Notification Service (APNs)
- In-app notification system

### Calendar Integration

Calendar events should integrate with:
- Google Calendar API
- Apple Calendar
- Outlook Calendar
- iCal format generation

## Security Considerations

1. **Geolocation Verification**
   - Use GPS accuracy metrics
   - Implement anti-spoofing measures
   - Consider venue-specific coordinates

2. **Timestamp Validation**
   - Server-side time validation
   - Prevent replay attacks
   - Handle timezone differences

3. **Authorization**
   - Validate user participation in matches
   - Check date ownership before operations
   - Implement rate limiting

4. **Data Privacy**
   - Encrypt sensitive date details
   - Implement data retention policies
   - GDPR compliance for user data

## Testing

### Unit Tests
- Date suggestion validation
- Compatibility score calculation
- Geolocation verification
- Token balance checks

### Integration Tests
- End-to-end date flow
- Blockchain integration
- Notification delivery
- Calendar event creation

### Load Tests
- Concurrent date suggestions
- High-volume match processing
- Blockchain transaction handling 