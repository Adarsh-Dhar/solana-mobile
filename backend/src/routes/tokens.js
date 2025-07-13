const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to validate Solana wallet address
const isValidSolanaAddress = (address) => {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
};

// Helper function to initiate Solana Pay transaction
const initiateSolanaPayTransaction = async (amount, currency, walletAddress) => {
  // TODO: Integrate with actual Solana Pay SDK
  // For now, return placeholder transaction data
  return {
    transaction: {
      message: `Payment for ${amount} dating tokens`,
      amount: amount * 0.1, // 0.1 SOL per token
      currency: currency,
      recipient: process.env.DATING_APP_WALLET || 'DatingAppWallet123',
      reference: `dating_tokens_${Date.now()}`
    },
    paymentUrl: `solana:${process.env.DATING_APP_WALLET}?amount=${amount * 0.1}&reference=dating_tokens_${Date.now()}`,
    txSignature: `3tH${Math.random().toString(36).substring(2, 15)}`
  };
};

// Helper function to confirm payment on-chain
const confirmPaymentOnChain = async (txSignature, expectedAmount) => {
  // TODO: Integrate with Solana RPC to verify transaction
  // For now, simulate successful payment confirmation
  return {
    confirmed: true,
    amount: expectedAmount,
    timestamp: new Date().toISOString(),
    blockHeight: Math.floor(Math.random() * 1000000) + 200000000
  };
};

// Helper function to update user token balance
const updateUserTokenBalance = async (userId, amount, operation = 'ADD') => {
  try {
    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // TODO: In a real implementation, this would be stored in a separate TokenBalance table
    // For now, we'll simulate the balance update
    const currentBalance = 5; // Mock current balance
    const newBalance = operation === 'ADD' ? currentBalance + amount : Math.max(0, currentBalance - amount);

    // Log the balance update
    console.log(`Token balance updated for user ${userId}: ${currentBalance} → ${newBalance} (${operation} ${amount})`);

    return {
      userId,
      previousBalance: currentBalance,
      newBalance,
      operation,
      amount,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error updating token balance:', error);
    throw error;
  }
};

// Helper function to mint voucher NFT receipt
const mintVoucherNFT = async (userId, amount, currency, txSignature) => {
  // TODO: Integrate with actual Solana NFT minting
  // For now, return placeholder NFT data
  const voucherId = `DqW${Math.random().toString(36).substring(2, 15)}`;
  
  return {
    voucherId,
    nftAddress: voucherId,
    metadata: {
      name: `Dating Tokens Voucher - ${amount} tokens`,
      description: `Voucher for ${amount} dating tokens purchased with ${currency}`,
      image: `ipfs://Qm${Math.random().toString(36).substring(2, 20)}/voucher.json`,
      attributes: [
        { trait_type: "Token Amount", value: amount },
        { trait_type: "Currency", value: currency },
        { trait_type: "Purchase Date", value: new Date().toISOString() },
        { trait_type: "Transaction", value: txSignature }
      ]
    },
    ipfsHash: `ipfs://Qm${Math.random().toString(36).substring(2, 20)}/voucher-metadata.json`
  };
};

// Helper function to get user token balance
const getUserTokenBalance = async (userId) => {
  // TODO: In a real implementation, this would query a TokenBalance table
  // For now, return a mock balance
  return {
    userId,
    balance: 10, // Mock balance
    lastUpdated: new Date().toISOString(),
    currency: 'DATING_TOKENS'
  };
};

// Helper function to validate payment amount
const validatePaymentAmount = (amount, currency) => {
  const minAmount = 1;
  const maxAmount = 100;
  
  if (amount < minAmount || amount > maxAmount) {
    throw new Error(`Amount must be between ${minAmount} and ${maxAmount} tokens`);
  }
  
  const supportedCurrencies = ['USDC', 'SOL', 'BONK'];
  if (!supportedCurrencies.includes(currency)) {
    throw new Error(`Unsupported currency. Supported: ${supportedCurrencies.join(', ')}`);
  }
  
  return true;
};

// POST /api/tokens/purchase
// Purpose: Buy dating tokens
router.post('/purchase', [
  authenticateToken,
  body('amount').isInt({ min: 1, max: 100 }).withMessage('Amount must be between 1 and 100 tokens'),
  body('currency').isIn(['USDC', 'SOL', 'BONK']).withMessage('Unsupported currency'),
  body('wallet').custom(isValidSolanaAddress).withMessage('Invalid Solana wallet address')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { amount, currency, wallet } = req.body;

    // Validate payment amount
    try {
      validatePaymentAmount(amount, currency);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    // Initiate Solana Pay transaction
    const paymentTransaction = await initiateSolanaPayTransaction(amount, currency, wallet);
    
    // Confirm payment on-chain
    const paymentConfirmation = await confirmPaymentOnChain(
      paymentTransaction.txSignature, 
      amount * 0.1 // 0.1 SOL per token
    );

    if (!paymentConfirmation.confirmed) {
      return res.status(400).json({ error: 'Payment confirmation failed' });
    }

    // Update user token balance
    const balanceUpdate = await updateUserTokenBalance(userId, amount, 'ADD');

    // Mint voucher NFT receipt
    const voucherNFT = await mintVoucherNFT(userId, amount, currency, paymentTransaction.txSignature);

    // Log the purchase
    console.log(`Token purchase completed: User ${userId} bought ${amount} tokens for ${currency}`);

    res.json({
      txSignature: paymentTransaction.txSignature,
      newBalance: balanceUpdate.newBalance,
      voucherNft: voucherNFT.voucherId,
      paymentDetails: {
        amount: amount,
        currency: currency,
        wallet: wallet,
        timestamp: new Date().toISOString()
      },
      voucherMetadata: voucherNFT.metadata
    });

  } catch (error) {
    console.error('Token purchase error:', error);
    res.status(500).json({ error: 'Failed to process token purchase' });
  }
});

// GET /api/tokens/balance
// Purpose: Get user's token balance
router.get('/balance', [
  authenticateToken
], async (req, res) => {
  try {
    const userId = req.user.id;

    const balance = await getUserTokenBalance(userId);

    res.json({
      userId: balance.userId,
      balance: balance.balance,
      currency: balance.currency,
      lastUpdated: balance.lastUpdated
    });

  } catch (error) {
    console.error('Get token balance error:', error);
    res.status(500).json({ error: 'Failed to get token balance' });
  }
});

// POST /api/tokens/spend
// Purpose: Spend dating tokens (for date suggestions, etc.)
router.post('/spend', [
  authenticateToken,
  body('amount').isInt({ min: 1, max: 50 }).withMessage('Amount must be between 1 and 50 tokens'),
  body('purpose').isString().withMessage('Purpose is required'),
  body('referenceId').optional().isString().withMessage('Reference ID must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { amount, purpose, referenceId } = req.body;

    // Get current balance
    const currentBalance = await getUserTokenBalance(userId);

    if (currentBalance.balance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient token balance',
        currentBalance: currentBalance.balance,
        requiredAmount: amount
      });
    }

    // Update user token balance (deduct tokens)
    const balanceUpdate = await updateUserTokenBalance(userId, amount, 'SUBTRACT');

    // Log the token spend
    console.log(`Tokens spent: User ${userId} spent ${amount} tokens for ${purpose}`);

    res.json({
      success: true,
      previousBalance: balanceUpdate.previousBalance,
      newBalance: balanceUpdate.newBalance,
      amountSpent: amount,
      purpose: purpose,
      referenceId: referenceId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Token spend error:', error);
    res.status(500).json({ error: 'Failed to spend tokens' });
  }
});

// GET /api/tokens/history
// Purpose: Get user's token transaction history
router.get('/history', [
  authenticateToken,
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  body('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
], async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // TODO: In a real implementation, this would query a TokenTransaction table
    // For now, return mock transaction history
    const mockHistory = [
      {
        id: 'tx-1',
        type: 'PURCHASE',
        amount: 5,
        currency: 'USDC',
        balance: 10,
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        reference: 'dating_tokens_1234567890',
        voucherNft: 'DqW123456789'
      },
      {
        id: 'tx-2',
        type: 'SPEND',
        amount: -1,
        currency: 'DATING_TOKENS',
        balance: 9,
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        purpose: 'Date suggestion',
        referenceId: 'date-789'
      }
    ];

    res.json({
      userId: userId,
      transactions: mockHistory.slice(offset, offset + limit),
      pagination: {
        total: mockHistory.length,
        limit: limit,
        offset: offset,
        hasMore: offset + limit < mockHistory.length
      }
    });

  } catch (error) {
    console.error('Get token history error:', error);
    res.status(500).json({ error: 'Failed to get token history' });
  }
});

// GET /api/tokens/vouchers
// Purpose: Get user's voucher NFTs
router.get('/vouchers', [
  authenticateToken
], async (req, res) => {
  try {
    const userId = req.user.id;

    // TODO: In a real implementation, this would query the blockchain for user's voucher NFTs
    // For now, return mock voucher data
    const mockVouchers = [
      {
        voucherId: 'DqW123456789',
        nftAddress: 'DqW123456789',
        amount: 5,
        currency: 'USDC',
        purchaseDate: new Date(Date.now() - 86400000).toISOString(),
        metadata: {
          name: 'Dating Tokens Voucher - 5 tokens',
          description: 'Voucher for 5 dating tokens purchased with USDC',
          image: 'ipfs://Qm123456789/voucher.json'
        },
        status: 'ACTIVE'
      }
    ];

    res.json({
      userId: userId,
      vouchers: mockVouchers,
      totalVouchers: mockVouchers.length
    });

  } catch (error) {
    console.error('Get vouchers error:', error);
    res.status(500).json({ error: 'Failed to get vouchers' });
  }
});

// POST /api/tokens/transfer
// Purpose: Transfer tokens to another user
router.post('/transfer', [
  authenticateToken,
  body('recipientId').isUUID().withMessage('Invalid recipient ID'),
  body('amount').isInt({ min: 1, max: 50 }).withMessage('Amount must be between 1 and 50 tokens'),
  body('message').optional().isString().withMessage('Message must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const senderId = req.user.id;
    const { recipientId, amount, message } = req.body;

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, username: true }
    });

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Prevent self-transfer
    if (senderId === recipientId) {
      return res.status(400).json({ error: 'Cannot transfer tokens to yourself' });
    }

    // Get sender's current balance
    const senderBalance = await getUserTokenBalance(senderId);

    if (senderBalance.balance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient token balance',
        currentBalance: senderBalance.balance,
        requiredAmount: amount
      });
    }

    // Update sender's balance (deduct)
    const senderUpdate = await updateUserTokenBalance(senderId, amount, 'SUBTRACT');

    // Update recipient's balance (add)
    const recipientUpdate = await updateUserTokenBalance(recipientId, amount, 'ADD');

    // Log the transfer
    console.log(`Token transfer: ${senderId} → ${recipientId} (${amount} tokens)`);

    res.json({
      success: true,
      transfer: {
        senderId: senderId,
        recipientId: recipientId,
        recipientUsername: recipient.username,
        amount: amount,
        message: message,
        timestamp: new Date().toISOString()
      },
      senderBalance: {
        previous: senderUpdate.previousBalance,
        new: senderUpdate.newBalance
      },
      recipientBalance: {
        previous: recipientUpdate.previousBalance,
        new: recipientUpdate.newBalance
      }
    });

  } catch (error) {
    console.error('Token transfer error:', error);
    res.status(500).json({ error: 'Failed to transfer tokens' });
  }
});

// GET /api/tokens/prices
// Purpose: Get current token prices
router.get('/prices', async (req, res) => {
  try {
    // TODO: In a real implementation, this would fetch prices from a price oracle
    // For now, return mock prices
    const prices = {
      USDC: {
        tokensPerUnit: 10, // 10 tokens per 1 USDC
        unitPrice: 0.1, // 0.1 USDC per token
        currency: 'USDC'
      },
      SOL: {
        tokensPerUnit: 100, // 100 tokens per 1 SOL
        unitPrice: 0.01, // 0.01 SOL per token
        currency: 'SOL'
      },
      BONK: {
        tokensPerUnit: 10000, // 10000 tokens per 1 BONK
        unitPrice: 0.0001, // 0.0001 BONK per token
        currency: 'BONK'
      }
    };

    res.json({
      prices: prices,
      lastUpdated: new Date().toISOString(),
      supportedCurrencies: Object.keys(prices)
    });

  } catch (error) {
    console.error('Get token prices error:', error);
    res.status(500).json({ error: 'Failed to get token prices' });
  }
});

module.exports = router;
