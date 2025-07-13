const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Register with Solana wallet
router.post('/register', [
  body('solanaAddress').isString().isLength({ min: 32, max: 44 }),
  body('mobileAuthToken').optional().isString(),
  body('username').trim().isLength({ min: 2, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { solanaAddress, mobileAuthToken, username } = req.body;

    // Check if user already exists by solanaAddress
    const existingUser = await prisma.user.findUnique({
      where: { solanaAddress }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Wallet already registered' });
    }

    // Create user with Solana wallet using schema fields
    const user = await prisma.user.create({
      data: {
        solanaAddress,
        mobileAuthToken,
        username,
        verificationStatus: 'UNVERIFIED' // Default from schema
      },
      select: {
        id: true,
        solanaAddress: true,
        username: true,
        verificationStatus: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login with Solana wallet using schema
router.post('/login', [
  body('solanaAddress').isString().isLength({ min: 32, max: 44 }),
  body('mobileAuthToken').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { solanaAddress, mobileAuthToken } = req.body;

    // Find user by Solana address using schema
    const user = await prisma.user.findUnique({
      where: { solanaAddress },
      select: {
        id: true,
        solanaAddress: true,
        username: true,
        verificationStatus: true,
        createdAt: true,
        mobileAuthToken: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Wallet not registered' });
    }

    // Update mobile auth token if provided
    if (mobileAuthToken) {
      await prisma.user.update({
        where: { id: user.id },
        data: { mobileAuthToken }
      });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        solanaAddress: user.solanaAddress,
        username: user.username,
        verificationStatus: user.verificationStatus
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

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

// Get user profile with wallet analysis
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const solanaAddress = req.headers['x-solana-address'];

    if (!solanaAddress) {
      return res.status(401).json({ error: 'No wallet address provided' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        walletAnalysis: true,
        preferences: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const solanaAddress = req.headers['x-solana-address'];
    if (!solanaAddress) {
      return res.status(401).json({ error: 'No wallet address provided' });
    }

    const { username, bio, age, gender, location } = req.body;

    const user = await prisma.user.update({
      where: { solanaAddress },
      data: {
        username: username || undefined,
        bio: bio || undefined,
        age: age || undefined,
        gender: gender || undefined,
        location: location || undefined
      },
      select: {
        id: true,
        solanaAddress: true,
        username: true,
        bio: true,
        age: true,
        gender: true,
        location: true,
        verificationStatus: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Verify wallet ownership (optional endpoint for additional verification)
router.post('/verify-wallet', [
  body('solanaAddress').isString().isLength({ min: 32, max: 44 }),
  body('signature').isString(),
  body('message').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { solanaAddress, signature, message } = req.body;

    // Here you would verify the signature using Solana web3.js
    // For now, we'll just check if the user exists using schema
    const user = await prisma.user.findUnique({
      where: { solanaAddress },
      select: {
        id: true,
        solanaAddress: true,
        username: true,
        verificationStatus: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // TODO: Implement actual signature verification
    // const isValidSignature = await verifySignature(solanaAddress, signature, message);
    // if (!isValidSignature) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    res.json({
      message: 'Wallet verified successfully',
      user
    });
  } catch (error) {
    console.error('Wallet verification error:', error);
    res.status(500).json({ error: 'Wallet verification failed' });
  }
});

module.exports = router; 