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

    // Find user by Solana address
    const user = await prisma.user.findUnique({
      where: { solanaAddress }
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
          where: { solanaAddress }
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

module.exports = {
  authenticateWallet,
  optionalAuth
}; 