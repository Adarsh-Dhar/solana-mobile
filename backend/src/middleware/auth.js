const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticateWallet = async (req, res, next) => {
  try {
    const solanaAddress = req.headers['x-solana-address'];
    
    if (!solanaAddress) {
      return res.status(401).json({ error: 'No wallet address provided' });
    }

    // Validate Solana address format (basic check)
    if (solanaAddress.length < 32 || solanaAddress.length > 44) {
      return res.status(401).json({ error: 'Invalid wallet address format' });
    }

    // Find user by Solana address using schema
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

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const solanaAddress = req.headers['x-solana-address'];
    
    if (solanaAddress) {
      // Validate Solana address format (basic check)
      if (solanaAddress.length >= 32 && solanaAddress.length <= 44) {
        const user = await prisma.user.findUnique({
          where: { solanaAddress },
          select: {
            id: true,
            solanaAddress: true,
            username: true,
            verificationStatus: true,
            createdAt: true
          }
        });

        if (user) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue without authentication
  }
};

// Middleware to check if user is verified
const requireVerifiedUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.verificationStatus !== 'VERIFIED') {
      return res.status(403).json({ 
        error: 'Account verification required',
        verificationStatus: req.user.verificationStatus 
      });
    }

    next();
  } catch (error) {
    console.error('Verification check error:', error);
    res.status(500).json({ error: 'Verification check failed' });
  }
};

// Middleware to get user with wallet analysis
const getUserWithAnalysis = async (req, res, next) => {
  try {
    const solanaAddress = req.headers['x-solana-address'];
    
    if (!solanaAddress) {
      return res.status(401).json({ error: 'No wallet address provided' });
    }

    const user = await prisma.user.findUnique({
      where: { solanaAddress },
      include: {
        walletAnalysis: true,
        preferences: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('User analysis error:', error);
    res.status(500).json({ error: 'Failed to get user analysis' });
  }
};

module.exports = {
  authenticateWallet,
  optionalAuth,
  requireVerifiedUser,
  getUserWithAnalysis
}; 