const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../middleware/auth');

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

    // Generate JWT token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
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

    // Generate JWT token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        solanaAddress: user.solanaAddress,
        username: user.username,
        verificationStatus: user.verificationStatus
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router; 