const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Predefined trait keys for validation
const VALID_TRAITS = [
  'HAS_MAD_LADS',
  'BONK_HOLDER',
  'JUP_HOLDER',
  'RAY_HOLDER',
  'DEFI_USER',
  'NFT_TRADER',
  'GAMING_NFT_HOLDER',
  'ART_NFT_HOLDER',
  'MEME_COIN_HOLDER',
  'GOVERNANCE_PARTICIPANT',
  'AIRDROP_RECEIVER',
  'HIGH_ACTIVITY',
  'LOW_RISK',
  'HIGH_RISK',
  'DAY_TRADER',
  'HODLER'
];

// Get current user by Solana address using schema
router.get('/me', async (req, res) => {
    try {
      const solanaAddress = req.headers['x-solana-address'];
      if (!solanaAddress) {
        return res.status(401).json({ error: 'No wallet address provided' });
      }
  
      const user = await prisma.user.findUnique({
        where: { solanaAddress },
        select: {
          id: true,
          solanaAddress: true,
          username: true,
          verificationStatus: true,
          createdAt: true,
          bio: true,
          age: true,
          gender: true,
          location: true,
          profilePicture: true
        }
      });
  
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
  
      res.json({ user });
    } catch (error) {
      console.error('Auth error:', error);
      res.status(401).json({ error: 'Invalid wallet address' });
    }
  });

// Update dating preferences
router.put('/preferences', [
  body('ageRange').optional().isArray({ min: 2, max: 2 }).withMessage('Age range must be an array with exactly 2 numbers'),
  body('ageRange.*').optional().isInt({ min: 18, max: 100 }).withMessage('Age must be between 18 and 100'),
  body('genderPreference').optional().isIn(['male', 'female', 'non-binary', 'any']).withMessage('Invalid gender preference'),
  body('maxDistance').optional().isInt({ min: 1, max: 500 }).withMessage('Max distance must be between 1 and 500'),
  body('minSybilScore').optional().isFloat({ min: 0, max: 1 }).withMessage('Min sybil score must be between 0 and 1'),
  body('desiredTraits').optional().isObject().withMessage('Desired traits must be an object'),
  body('avoidTraits').optional().isArray().withMessage('Avoid traits must be an array'),
  body('chainActivityReq').optional().isObject().withMessage('Chain activity requirements must be an object'),
  body('notifications').optional().isObject().withMessage('Notifications must be an object')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const solanaAddress = req.headers['x-solana-address'];
    if (!solanaAddress) {
      return res.status(401).json({ error: 'No wallet address provided' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { solanaAddress },
      include: { preferences: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { 
      ageRange, 
      genderPreference, 
      maxDistance, 
      desiredTraits, 
      avoidTraits, 
      minSybilScore,
      chainActivityReq,
      notifications 
    } = req.body;

    // Validate desired traits against predefined list
    if (desiredTraits) {
      const invalidTraits = Object.keys(desiredTraits).filter(trait => !VALID_TRAITS.includes(trait));
      if (invalidTraits.length > 0) {
        return res.status(400).json({ 
          error: 'Invalid trait keys', 
          invalidTraits,
          validTraits: VALID_TRAITS 
        });
      }

      // Validate trait weights are between 0 and 1
      const invalidWeights = Object.entries(desiredTraits).filter(([_, weight]) => 
        typeof weight !== 'number' || weight < 0 || weight > 1
      );
      if (invalidWeights.length > 0) {
        return res.status(400).json({ 
          error: 'Trait weights must be numbers between 0 and 1',
          invalidWeights 
        });
      }
    }

    // Prepare update data
    const updateData = {};
    
    if (ageRange) updateData.ageRange = ageRange;
    if (genderPreference) updateData.genderPreference = genderPreference;
    if (maxDistance) updateData.maxDistance = maxDistance;
    if (desiredTraits) updateData.desiredTraits = desiredTraits;
    if (avoidTraits) updateData.avoidTraits = avoidTraits;
    if (minSybilScore !== undefined) updateData.minSybilScore = minSybilScore;
    if (chainActivityReq) updateData.chainActivityReq = chainActivityReq;

    // Update or create preferences
    let preferences;
    if (user.preferences) {
      // Update existing preferences
      preferences = await prisma.preferences.update({
        where: { userId: user.id },
        data: updateData
      });
    } else {
      // Create new preferences
      preferences = await prisma.preferences.create({
        data: {
          userId: user.id,
          ...updateData
        }
      });
    }

    // TODO: Trigger match cache refresh
    // This would typically involve:
    // 1. Invalidating cached matches for this user
    // 2. Recalculating compatibility scores
    // 3. Updating match recommendations
    console.log('Preferences updated, match cache refresh needed for user:', user.id);

    res.json({ 
      message: 'Preferences updated successfully',
      preferences 
    });

  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

module.exports = router; 
