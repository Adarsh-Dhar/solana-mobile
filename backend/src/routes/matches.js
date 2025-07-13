const express = require('express');
const { query, param, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to calculate compatibility score
const calculateCompatibilityScore = (user1, user2, user1Prefs, user2Prefs) => {
  let score = 0;
  
  // Age compatibility
  if (user1.age && user2.age && user1Prefs.ageRange && user2Prefs.ageRange) {
    const user1InRange = user2.age >= user1Prefs.ageRange[0] && user2.age <= user1Prefs.ageRange[1];
    const user2InRange = user1.age >= user2Prefs.ageRange[0] && user1.age <= user2Prefs.ageRange[1];
    if (user1InRange && user2InRange) score += 20;
  }
  
  // Gender preference compatibility
  if (user1Prefs.genderPreference && user2.gender === user1Prefs.genderPreference) score += 15;
  if (user2Prefs.genderPreference && user1.gender === user2Prefs.genderPreference) score += 15;
  
  // Sybil score compatibility
  if (user1.walletAnalysis?.sybilScore && user2.walletAnalysis?.sybilScore) {
    const minSybil1 = user1Prefs.minSybilScore || 0.7;
    const minSybil2 = user2Prefs.minSybilScore || 0.7;
    if (user2.walletAnalysis.sybilScore >= minSybil1) score += 10;
    if (user1.walletAnalysis.sybilScore >= minSybil2) score += 10;
  }
  
  // NFT collection overlap
  if (user1.walletAnalysis?.topCollections && user2.walletAnalysis?.topCollections) {
    const sharedCollections = user1.walletAnalysis.topCollections.filter(
      collection => user2.walletAnalysis.topCollections.includes(collection)
    );
    score += sharedCollections.length * 15;
  }
  
  // Cultural alignment
  if (user1.walletAnalysis?.culturalAlignment && user2.walletAnalysis?.culturalAlignment) {
    const sharedCultures = user1.walletAnalysis.culturalAlignment.filter(
      culture => user2.walletAnalysis.culturalAlignment.includes(culture)
    );
    score += sharedCultures.length * 10;
  }
  
  // DeFi activity overlap
  if (user1.walletAnalysis?.defiActivity && user2.walletAnalysis?.defiActivity) {
    const sharedDefi = user1.walletAnalysis.defiActivity.filter(
      activity => user2.walletAnalysis.defiActivity.includes(activity)
    );
    score += sharedDefi.length * 8;
  }
  
  return Math.min(score, 100); // Cap at 100
};

// Helper function to calculate match reasons
const calculateMatchReasons = (user1, user2, user1Prefs, user2Prefs) => {
  const reasons = [];
  
  // Age compatibility
  if (user1.age && user2.age && user1Prefs.ageRange && user2Prefs.ageRange) {
    const user1InRange = user2.age >= user1Prefs.ageRange[0] && user2.age <= user1Prefs.ageRange[1];
    const user2InRange = user1.age >= user2Prefs.ageRange[0] && user1.age <= user2Prefs.ageRange[1];
    if (user1InRange && user2InRange) {
      reasons.push(`${Math.abs(user1.age - user2.age)} years apart`);
    }
  }
  
  // NFT collection overlap
  if (user1.walletAnalysis?.topCollections && user2.walletAnalysis?.topCollections) {
    const sharedCollections = user1.walletAnalysis.topCollections.filter(
      collection => user2.walletAnalysis.topCollections.includes(collection)
    );
    sharedCollections.forEach(collection => {
      reasons.push(`Both ${collection} holders`);
    });
  }
  
  // Cultural alignment
  if (user1.walletAnalysis?.culturalAlignment && user2.walletAnalysis?.culturalAlignment) {
    const sharedCultures = user1.walletAnalysis.culturalAlignment.filter(
      culture => user2.walletAnalysis.culturalAlignment.includes(culture)
    );
    sharedCultures.forEach(culture => {
      reasons.push(`Both ${culture} enthusiasts`);
    });
  }
  
  // DeFi activity overlap
  if (user1.walletAnalysis?.defiActivity && user2.walletAnalysis?.defiActivity) {
    const sharedDefi = user1.walletAnalysis.defiActivity.filter(
      activity => user2.walletAnalysis.defiActivity.includes(activity)
    );
    sharedDefi.forEach(activity => {
      reasons.push(`Both active in ${activity}`);
    });
  }
  
  // Airdrop overlap
  if (user1.walletAnalysis?.airdropsReceived && user2.walletAnalysis?.airdropsReceived) {
    const sharedAirdrops = user1.walletAnalysis.airdropsReceived.filter(
      airdrop => user2.walletAnalysis.airdropsReceived.includes(airdrop)
    );
    sharedAirdrops.forEach(airdrop => {
      reasons.push(`Both received ${airdrop} airdrop`);
    });
  }
  
  return reasons;
};

// GET /api/matches/suggestions
router.get('/suggestions', [
  authenticateToken,
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    // Get user and their preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
        walletAnalysis: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.preferences) {
      return res.status(400).json({ error: 'User preferences not set' });
    }

    // Get existing matches to exclude already matched users
    const existingMatches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      select: {
        user1Id: true,
        user2Id: true
      }
    });

    const excludedUserIds = existingMatches.map(match => 
      match.user1Id === userId ? match.user2Id : match.user1Id
    );

    // Query compatible users
    const compatibleUsers = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          { id: { notIn: excludedUserIds } },
          { preferences: { isNot: null } },
          { walletAnalysis: { isNot: null } },
          // Age filter
          user.age ? {
            age: {
              gte: user.preferences.ageRange[0],
              lte: user.preferences.ageRange[1]
            }
          } : {},
          // Gender preference filter
          user.preferences.genderPreference ? {
            gender: user.preferences.genderPreference
          } : {},
          // Sybil score filter
          user.preferences.minSybilScore ? {
            walletAnalysis: {
              sybilScore: {
                gte: user.preferences.minSybilScore
              }
            }
          } : {}
        ]
      },
      include: {
        preferences: true,
        walletAnalysis: true
      },
      take: limit * 3, // Get more to filter and sort
      skip: offset
    });

    // Calculate compatibility scores and reasons
    const scoredMatches = compatibleUsers.map(potentialMatch => {
      const compatibilityScore = calculateCompatibilityScore(
        user, 
        potentialMatch, 
        user.preferences, 
        potentialMatch.preferences
      );
      
      const reasons = calculateMatchReasons(
        user, 
        potentialMatch, 
        user.preferences, 
        potentialMatch.preferences
      );

      return {
        userId: potentialMatch.id,
        username: potentialMatch.username,
        age: potentialMatch.age,
        gender: potentialMatch.gender,
        location: potentialMatch.location,
        profilePicture: potentialMatch.profilePicture,
        compatibilityScore,
        reasons,
        onchainProofs: {
          sharedCollections: potentialMatch.walletAnalysis?.topCollections?.filter(
            collection => user.walletAnalysis?.topCollections?.includes(collection)
          ) || [],
          jointAirdrops: potentialMatch.walletAnalysis?.airdropsReceived?.filter(
            airdrop => user.walletAnalysis?.airdropsReceived?.includes(airdrop)
          ) || [],
          culturalAlignment: potentialMatch.walletAnalysis?.culturalAlignment?.filter(
            culture => user.walletAnalysis?.culturalAlignment?.includes(culture)
          ) || []
        }
      };
    });

    // Sort by compatibility score and take top results
    const topMatches = scoredMatches
      .filter(match => match.compatibilityScore > 30) // Minimum compatibility threshold
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, limit);

    res.json(topMatches);
  } catch (error) {
    console.error('Match suggestions error:', error);
    res.status(500).json({ error: 'Failed to get match suggestions' });
  }
});

// POST /api/matches/:matchId/like
router.post('/:matchId/like', [
  authenticateToken,
  param('matchId').isUUID().withMessage('Invalid match ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const matchId = req.params.matchId;

    // Get the potential match user
    const potentialMatch = await prisma.user.findUnique({
      where: { id: matchId },
      include: {
        preferences: true,
        walletAnalysis: true
      }
    });

    if (!potentialMatch) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if match already exists
    const existingMatch = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: matchId },
          { user1Id: matchId, user2Id: userId }
        ]
      }
    });

    if (existingMatch) {
      return res.status(400).json({ error: 'Match already exists' });
    }

    // Get current user data for compatibility calculation
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
        walletAnalysis: true
      }
    });

    // Calculate compatibility score
    const compatibilityScore = calculateCompatibilityScore(
      currentUser,
      potentialMatch,
      currentUser.preferences,
      potentialMatch.preferences
    );

    // Calculate match reasons
    const matchReasons = calculateMatchReasons(
      currentUser,
      potentialMatch,
      currentUser.preferences,
      potentialMatch.preferences
    );

    // Create match record
    const match = await prisma.match.create({
      data: {
        user1Id: userId,
        user2Id: matchId,
        compatibilityScore,
        matchReasons,
        status: 'PENDING'
      }
    });

    // Check for mutual like
    const mutualMatch = await prisma.match.findFirst({
      where: {
        user1Id: matchId,
        user2Id: userId,
        status: 'PENDING'
      }
    });

    if (mutualMatch) {
      // Update both matches to ACCEPTED
      await prisma.match.updateMany({
        where: {
          OR: [
            { id: match.id },
            { id: mutualMatch.id }
          ]
        },
        data: { status: 'ACCEPTED' }
      });

      // Generate chat channel ID (simple implementation)
      const chatChannelId = `chat-${match.id}-${mutualMatch.id}`;

      // TODO: Mint Match NFT to both wallets
      // This would integrate with Solana wallet operations
      const nftMintAddress = `7xK${Math.random().toString(36).substring(2, 15)}`;

      // TODO: Send push notification
      // This would integrate with push notification service

      // TODO: Deduct dating token from balance
      // This would integrate with token balance system
      const tokenBalance = 4; // Mock value

      return res.json({
        matchStatus: 'MUTUAL',
        chatChannelId,
        nftMintAddress,
        tokenBalance,
        match: {
          id: match.id,
          compatibilityScore,
          matchReasons
        }
      });
    }

    // Single like response
    res.json({
      matchStatus: 'PENDING',
      match: {
        id: match.id,
        compatibilityScore,
        matchReasons
      }
    });

  } catch (error) {
    console.error('Like match error:', error);
    res.status(500).json({ error: 'Failed to like match' });
  }
});

module.exports = router;
