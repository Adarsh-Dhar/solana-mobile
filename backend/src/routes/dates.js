const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to validate user has enough dating tokens
const validateDatingTokens = async (userId, requiredTokens = 1) => {
  // TODO: Integrate with actual token balance system
  // For now, return true as placeholder
  return true;
};

// Helper function to generate on-chain proof (NFT placeholder)
const generateOnChainProof = async (dateDetails) => {
  // TODO: Integrate with actual Solana NFT minting
  // For now, return placeholder data
  return {
    nftAddress: `FvK${Math.random().toString(36).substring(2, 15)}`,
    ipfsHash: `ipfs://Qm${Math.random().toString(36).substring(2, 20)}`,
    metadata: {
      name: `Date NFT - ${dateDetails.title}`,
      description: dateDetails.description || 'A special date NFT',
      image: `ipfs://Qm${Math.random().toString(36).substring(2, 20)}/date-preview.json`
    }
  };
};

// Helper function to send in-app notification
const sendNotification = async (userId, title, body, data = {}) => {
  // TODO: Integrate with push notification service
  console.log(`Notification to ${userId}: ${title} - ${body}`, data);
};

// Helper function to mint finalized Date NFT
const mintDateNFT = async (dateDetails, participants) => {
  // TODO: Integrate with actual Solana NFT minting
  return {
    txSignature: `5sx${Math.random().toString(36).substring(2, 15)}`,
    nftAddress: `FvK${Math.random().toString(36).substring(2, 15)}`,
    metadata: {
      name: `Confirmed Date - ${dateDetails.title}`,
      description: `A confirmed date between ${participants[0]} and ${participants[1]}`,
      attributes: [
        { trait_type: "Date Type", value: dateDetails.locationType },
        { trait_type: "Location", value: dateDetails.location },
        { trait_type: "Status", value: "CONFIRMED" }
      ]
    }
  };
};

// Helper function to create escrow for date funding
const createEscrow = async (dateId, amount) => {
  // TODO: Integrate with actual Solana escrow system
  return {
    escrowAddress: `Esc${Math.random().toString(36).substring(2, 15)}`,
    amount: amount || 0.1, // SOL
    status: 'LOCKED'
  };
};

// Helper function to verify geolocation
const verifyLocation = async (coordinates, venueCoordinates, maxDistance = 100) => {
  // Simple distance calculation (in meters)
  const [lat1, lon1] = coordinates;
  const [lat2, lon2] = venueCoordinates;
  
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distance = R * c;
  return distance <= maxDistance;
};

// Helper function to mint commemorative POAP
const mintPOAP = async (dateId, participants) => {
  // TODO: Integrate with actual POAP minting
  return {
    poapMintAddress: `8yT${Math.random().toString(36).substring(2, 15)}`,
    metadata: {
      name: `Date Completion POAP`,
      description: `Commemorative POAP for completed date`,
      image: `ipfs://Qm${Math.random().toString(36).substring(2, 20)}/poap.json`
    }
  };
};

// POST /api/dates/suggest
// Purpose: Suggest a date location/activity
router.post('/suggest', [
  authenticateToken,
  body('matchId').isUUID().withMessage('Invalid match ID'),
  body('locationType').isIn(['NFT_GALLERY', 'CRYPTO_CAFE', 'BLOCKCHAIN_EVENT', 'DEFI_MEETUP', 'CUSTOM']).withMessage('Invalid location type'),
  body('customDetails').optional().isString().withMessage('Custom details must be a string'),
  body('proposedTime').optional().isISO8601().withMessage('Invalid date format'),
  body('location').optional().isString().withMessage('Location must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { matchId, locationType, customDetails, proposedTime, location } = req.body;

    // Validate match exists and user is participant
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        status: 'ACCEPTED'
      },
      include: {
        user1: true,
        user2: true
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found or not accepted' });
    }

    // Validate both users have enough dating tokens
    const hasTokens = await validateDatingTokens(userId, 1);
    if (!hasTokens) {
      return res.status(400).json({ error: 'Insufficient dating tokens' });
    }

    // Generate title based on location type
    const locationTitles = {
      'NFT_GALLERY': 'NFT Gallery Meetup',
      'CRYPTO_CAFE': 'Crypto Cafe Date',
      'BLOCKCHAIN_EVENT': 'Blockchain Event Together',
      'DEFI_MEETUP': 'DeFi Meetup Date',
      'CUSTOM': customDetails || 'Custom Date'
    };

    const title = locationTitles[locationType];

    // Create date proposal record
    const dateSuggestion = await prisma.dateSuggestion.create({
      data: {
        matchId: matchId,
        suggestedById: userId,
        title: title,
        description: customDetails || `A ${locationType.toLowerCase().replace('_', ' ')} date`,
        location: location || 'To be determined',
        time: proposedTime ? new Date(proposedTime) : null,
        status: 'PROPOSED'
      }
    });

    // Generate on-chain proof (NFT placeholder)
    const onChainProof = await generateOnChainProof({
      title,
      description: customDetails,
      locationType
    });

    // Send in-app notification to other user
    const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
    await sendNotification(
      otherUserId,
      'New Date Suggestion',
      `${req.user.username} suggested a ${locationType.toLowerCase().replace('_', ' ')} date!`,
      { dateId: dateSuggestion.id, matchId }
    );

    res.json({
      dateId: dateSuggestion.id,
      proposalStatus: 'PENDING',
      dateNftPreview: onChainProof.ipfsHash,
      title,
      description: customDetails,
      locationType,
      suggestedBy: req.user.username
    });

  } catch (error) {
    console.error('Date suggestion error:', error);
    res.status(500).json({ error: 'Failed to suggest date' });
  }
});

// POST /api/dates/:dateId/confirm
// Purpose: Confirm date details
router.post('/:dateId/confirm', [
  authenticateToken,
  param('dateId').isUUID().withMessage('Invalid date ID'),
  body('confirmedTime').optional().isISO8601().withMessage('Invalid date format'),
  body('confirmedLocation').optional().isString().withMessage('Location must be a string'),
  body('additionalDetails').optional().isString().withMessage('Additional details must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { dateId } = req.params;
    const { confirmedTime, confirmedLocation, additionalDetails } = req.body;

    // Get date suggestion and validate user is participant
    const dateSuggestion = await prisma.dateSuggestion.findFirst({
      where: {
        id: dateId,
        status: 'PROPOSED'
      },
      include: {
        match: {
          include: {
            user1: true,
            user2: true
          }
        }
      }
    });

    if (!dateSuggestion) {
      return res.status(404).json({ error: 'Date suggestion not found or already confirmed' });
    }

    // Check if user is part of the match
    const isParticipant = dateSuggestion.match.user1Id === userId || dateSuggestion.match.user2Id === userId;
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to confirm this date' });
    }

    // Update date suggestion with confirmed details
    const updatedDate = await prisma.dateSuggestion.update({
      where: { id: dateId },
      data: {
        status: 'CONFIRMED',
        time: confirmedTime ? new Date(confirmedTime) : dateSuggestion.time,
        location: confirmedLocation || dateSuggestion.location,
        description: additionalDetails ? `${dateSuggestion.description}\n\n${additionalDetails}` : dateSuggestion.description
      }
    });

    // Mint finalized Date NFT with encrypted details
    const participants = [dateSuggestion.match.user1.username, dateSuggestion.match.user2.username];
    const dateNFT = await mintDateNFT({
      title: updatedDate.title,
      location: updatedDate.location,
      locationType: 'CONFIRMED'
    }, participants);

    // Create escrow for date funding
    const escrow = await createEscrow(dateId, 0.1); // 0.1 SOL

    // Generate calendar event URL
    const calendarEvent = `webcal://dates.dinetimeyt.com/event/${dateId}`;

    // Send notifications to both participants
    await sendNotification(
      dateSuggestion.match.user1Id,
      'Date Confirmed!',
      `Your date with ${dateSuggestion.match.user2.username} has been confirmed!`,
      { dateId, nftAddress: dateNFT.nftAddress }
    );

    await sendNotification(
      dateSuggestion.match.user2Id,
      'Date Confirmed!',
      `Your date with ${dateSuggestion.match.user1.username} has been confirmed!`,
      { dateId, nftAddress: dateNFT.nftAddress }
    );

    res.json({
      txSignature: dateNFT.txSignature,
      nftAddress: dateNFT.nftAddress,
      calendarEvent,
      escrowAddress: escrow.escrowAddress,
      confirmedTime: updatedDate.time,
      confirmedLocation: updatedDate.location
    });

  } catch (error) {
    console.error('Date confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm date' });
  }
});

// POST /api/dates/:dateId/verify
// Purpose: Verify date occurred via geolocation
router.post('/:dateId/verify', [
  authenticateToken,
  param('dateId').isUUID().withMessage('Invalid date ID'),
  body('coordinates').isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [lat, lng]'),
  body('coordinates.*').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('timestamp').isISO8601().withMessage('Invalid timestamp format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { dateId } = req.params;
    const { coordinates, timestamp } = req.body;

    // Get date suggestion and validate user is participant
    const dateSuggestion = await prisma.dateSuggestion.findFirst({
      where: {
        id: dateId,
        status: 'CONFIRMED'
      },
      include: {
        match: {
          include: {
            user1: true,
            user2: true
          }
        }
      }
    });

    if (!dateSuggestion) {
      return res.status(404).json({ error: 'Confirmed date not found' });
    }

    // Check if user is part of the match
    const isParticipant = dateSuggestion.match.user1Id === userId || dateSuggestion.match.user2Id === userId;
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to verify this date' });
    }

    // Validate timestamp window (within 2 hours of scheduled time)
    const scheduledTime = dateSuggestion.time;
    const verificationTime = new Date(timestamp);
    const timeDiff = Math.abs(verificationTime - scheduledTime);
    const maxTimeDiff = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

    if (timeDiff > maxTimeDiff) {
      return res.status(400).json({ 
        error: 'Verification timestamp too far from scheduled time',
        scheduledTime,
        verificationTime,
        timeDiff: timeDiff / (1000 * 60) // minutes
      });
    }

    // TODO: Get venue coordinates from date location
    // For now, use placeholder coordinates
    const venueCoordinates = [37.7749, -122.4194]; // San Francisco coordinates

    // Verify location
    const locationVerified = await verifyLocation(coordinates, venueCoordinates, 100); // 100m radius

    if (!locationVerified) {
      return res.status(400).json({ 
        error: 'Location verification failed',
        providedCoordinates: coordinates,
        venueCoordinates,
        maxDistance: 100
      });
    }

    // Update date status to completed
    await prisma.dateSuggestion.update({
      where: { id: dateId },
      data: { status: 'COMPLETED' }
    });

    // Unlock date NFT metadata (in real implementation, this would update on-chain metadata)
    const unlockedMetadata = {
      status: 'COMPLETED',
      verificationTime: timestamp,
      coordinates: coordinates
    };

    // Release escrowed funds
    const releasedFunds = {
      status: 'RELEASED',
      amount: 0.1, // SOL
      txSignature: `rel${Math.random().toString(36).substring(2, 15)}`
    };

    // Mint commemorative POAP
    const participants = [dateSuggestion.match.user1.username, dateSuggestion.match.user2.username];
    const poap = await mintPOAP(dateId, participants);

    // Send completion notifications
    await sendNotification(
      dateSuggestion.match.user1Id,
      'Date Completed!',
      `Your date with ${dateSuggestion.match.user2.username} has been verified and completed!`,
      { dateId, poapMintAddress: poap.poapMintAddress }
    );

    await sendNotification(
      dateSuggestion.match.user2Id,
      'Date Completed!',
      `Your date with ${dateSuggestion.match.user1.username} has been verified and completed!`,
      { dateId, poapMintAddress: poap.poapMintAddress }
    );

    res.json({
      verificationStatus: 'CONFIRMED',
      poapMintAddress: poap.poapMintAddress,
      unlockedMetadata,
      releasedFunds,
      completionTime: timestamp
    });

  } catch (error) {
    console.error('Date verification error:', error);
    res.status(500).json({ error: 'Failed to verify date' });
  }
});

// GET /api/dates/:dateId
// Purpose: Get date details
router.get('/:dateId', [
  authenticateToken,
  param('dateId').isUUID().withMessage('Invalid date ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { dateId } = req.params;

    const dateSuggestion = await prisma.dateSuggestion.findFirst({
      where: {
        id: dateId,
        match: {
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        }
      },
      include: {
        match: {
          include: {
            user1: true,
            user2: true
          }
        },
        suggestedBy: true
      }
    });

    if (!dateSuggestion) {
      return res.status(404).json({ error: 'Date not found' });
    }

    res.json({
      id: dateSuggestion.id,
      title: dateSuggestion.title,
      description: dateSuggestion.description,
      location: dateSuggestion.location,
      time: dateSuggestion.time,
      status: dateSuggestion.status,
      suggestedBy: dateSuggestion.suggestedBy?.username,
      participants: [
        dateSuggestion.match.user1.username,
        dateSuggestion.match.user2.username
      ],
      matchId: dateSuggestion.matchId
    });

  } catch (error) {
    console.error('Get date error:', error);
    res.status(500).json({ error: 'Failed to get date details' });
  }
});

// GET /api/dates/match/:matchId
// Purpose: Get all dates for a specific match
router.get('/match/:matchId', [
  authenticateToken,
  param('matchId').isUUID().withMessage('Invalid match ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { matchId } = req.params;

    // Verify user is part of the match
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const dates = await prisma.dateSuggestion.findMany({
      where: { matchId },
      include: {
        suggestedBy: {
          select: {
            id: true,
            username: true,
            profilePicture: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(dates);

  } catch (error) {
    console.error('Get match dates error:', error);
    res.status(500).json({ error: 'Failed to get match dates' });
  }
});

module.exports = router;
