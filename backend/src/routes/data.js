const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helius API configuration
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || 'your-helius-api-key';
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Background job storage (in production, use Redis or a proper job queue)
const backgroundJobs = new Map();

// POST /api/data/refresh
// Manually trigger on-chain data refresh
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const solanaAddress = req.user.solanaAddress;

    // Generate job ID
    const jobId = `refresh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store job in memory
    backgroundJobs.set(jobId, { 
      status: 'queued', 
      createdAt: new Date(),
      userId,
      solanaAddress
    });

    // Start background job immediately
    (async () => {
      try {
        console.log(`Starting wallet refresh job ${jobId} for user ${userId}`);

        // Fetch latest data from Helius
        const accountResponse = await axios.post(HELIUS_RPC_URL, {
          jsonrpc: '2.0',
          id: 1,
          method: 'getAccountInfo',
          params: [solanaAddress, { encoding: 'jsonParsed', commitment: 'confirmed' }]
        });

        const tokenAccountsResponse = await axios.post(HELIUS_RPC_URL, {
          jsonrpc: '2.0',
          id: 1,
          method: 'getTokenAccountsByOwner',
          params: [
            solanaAddress,
            { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
            { encoding: 'jsonParsed' }
          ]
        });

        const transactionsResponse = await axios.post(HELIUS_RPC_URL, {
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignaturesForAddress',
          params: [solanaAddress, { limit: 20 }]
        });

        // Get user profile
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { walletAnalysis: true }
        });

        if (!user) {
          throw new Error('User not found');
        }

        // Calculate new wallet analysis
        const nftCount = tokenAccountsResponse.data.result?.value?.filter(token => 
          token.account.data.parsed.info.tokenAmount.uiAmount > 0
        ).length || 0;

        const recentTxCount = transactionsResponse.data.result?.length || 0;
        const txFrequency = recentTxCount / 7; // Transactions per day over last week

        // Update or create wallet analysis
        await prisma.walletAnalysis.upsert({
          where: { userId },
          update: {
            nftCount,
            txFrequency,
            updatedAt: new Date()
          },
          create: {
            userId,
            nftCount,
            txFrequency,
            walletAge: user.createdAt,
            sybilScore: 0.0,
            rugCount: 0
          }
        });

        // Recalculate compatibility scores for all matches
        const matches = await prisma.match.findMany({
          where: {
            OR: [
              { user1Id: userId },
              { user2Id: userId }
            ]
          },
          include: {
            user1: { include: { walletAnalysis: true } },
            user2: { include: { walletAnalysis: true } }
          }
        });

        for (const match of matches) {
          // Simple compatibility calculation
          const user1Score = 0.5 + (match.user1.walletAnalysis?.nftCount || 0) * 0.02;
          const user2Score = 0.5 + (match.user2.walletAnalysis?.nftCount || 0) * 0.02;
          const compatibilityScore = (user1Score + user2Score) / 2;

          await prisma.match.update({
            where: { id: match.id },
            data: { compatibilityScore }
          });
        }

        // Update job status
        backgroundJobs.set(jobId, { status: 'completed', completedAt: new Date() });
        console.log(`Wallet refresh job ${jobId} completed successfully`);

      } catch (error) {
        console.error(`Wallet refresh job ${jobId} failed:`, error);
        backgroundJobs.set(jobId, { 
          status: 'failed', 
          error: error.message,
          failedAt: new Date() 
        });
      }
    })();

    res.json({
      jobId,
      status: 'queued',
      message: 'Wallet data refresh job started'
    });

  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Failed to start refresh job' });
  }
});

// GET /api/data/wallet-snapshot
// Get real-time wallet summary
router.get('/wallet-snapshot', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const solanaAddress = req.user.solanaAddress;

    // Get user profile with wallet analysis
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { walletAnalysis: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch live balance data from Helius
    const accountResponse = await axios.post(HELIUS_RPC_URL, {
      jsonrpc: '2.0',
      id: 1,
      method: 'getAccountInfo',
      params: [solanaAddress, { encoding: 'jsonParsed', commitment: 'confirmed' }]
    });

    const tokenAccountsResponse = await axios.post(HELIUS_RPC_URL, {
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenAccountsByOwner',
      params: [
        solanaAddress,
        { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        { encoding: 'jsonParsed' }
      ]
    });

    const transactionsResponse = await axios.post(HELIUS_RPC_URL, {
      jsonrpc: '2.0',
      id: 1,
      method: 'getSignaturesForAddress',
      params: [solanaAddress, { limit: 5 }]
    });

    // Calculate SOL balance
    const solBalance = accountResponse.data.result?.value?.lamports 
      ? accountResponse.data.result.value.lamports / 1e9 
      : 0;

    // Calculate BONK balance (assuming BONK token mint)
    const bonkMint = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'; // BONK token mint
    const bonkAccount = tokenAccountsResponse.data.result?.value?.find(token => 
      token.account.data.parsed.info.mint === bonkMint
    );
    const bonkBalance = bonkAccount 
      ? bonkAccount.account.data.parsed.info.tokenAmount.uiAmount 
      : 0;

    // Get last activity
    const lastActivity = transactionsResponse.data.result?.[0]?.blockTime 
      ? new Date(transactionsResponse.data.result[0].blockTime * 1000).toISOString()
      : user.createdAt.toISOString();

    // Calculate live reputation score
    let liveReputation = 0.5; // Base score
    
    // Factor in wallet age
    if (user.walletAnalysis?.walletAge) {
      const walletAgeDays = (Date.now() - new Date(user.walletAnalysis.walletAge).getTime()) / (1000 * 60 * 60 * 24);
      if (walletAgeDays > 365) liveReputation += 0.1;
      if (walletAgeDays > 730) liveReputation += 0.1;
    }

    // Factor in NFT holdings
    if (user.walletAnalysis?.nftCount > 0) {
      liveReputation += Math.min(user.walletAnalysis.nftCount * 0.02, 0.2);
    }

    // Factor in DeFi activity
    if (user.walletAnalysis?.defiActivity?.length > 0) {
      liveReputation += Math.min(user.walletAnalysis.defiActivity.length * 0.05, 0.15);
    }

    // Factor in airdrops
    if (user.walletAnalysis?.airdropsReceived?.length > 0) {
      liveReputation += Math.min(user.walletAnalysis.airdropsReceived.length * 0.03, 0.1);
    }

    // Penalize rug count
    if (user.walletAnalysis?.rugCount > 0) {
      liveReputation -= Math.min(user.walletAnalysis.rugCount * 0.1, 0.3);
    }

    liveReputation = Math.max(0, Math.min(1, liveReputation));

    res.json({
      solBalance: parseFloat(solBalance.toFixed(4)),
      bonkBalance: parseInt(bonkBalance),
      lastActivity,
      liveReputation: parseFloat(liveReputation.toFixed(2)),
      nftCount: user.walletAnalysis?.nftCount || 0,
      walletAge: user.walletAnalysis?.walletAge || user.createdAt,
      defiActivity: user.walletAnalysis?.defiActivity || []
    });

  } catch (error) {
    console.error('Wallet snapshot error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet snapshot' });
  }
});

// GET /api/data/refresh-status/:jobId
// Check status of refresh job
router.get('/refresh-status/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = backgroundJobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      jobId,
      status: job.status,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      failedAt: job.failedAt,
      error: job.error
    });

  } catch (error) {
    console.error('Job status error:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

module.exports = router;
