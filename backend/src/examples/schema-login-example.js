const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Example: How to use Prisma schema for login
const loginWithSchema = async (solanaAddress) => {
  try {
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
      throw new Error('User not found');
    }

    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Example: How to register user using schema
const registerWithSchema = async (solanaAddress, username, mobileAuthToken) => {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { solanaAddress }
    });

    if (existingUser) {
      throw new Error('Wallet already registered');
    }

    // Create user using schema fields
    const user = await prisma.user.create({
      data: {
        solanaAddress,
        username,
        mobileAuthToken,
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

    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Example: How to get user with wallet analysis
const getUserWithAnalysis = async (solanaAddress) => {
  try {
    const user = await prisma.user.findUnique({
      where: { solanaAddress },
      include: {
        walletAnalysis: true,
        preferences: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('Get user error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Example: How to update user profile using schema
const updateUserProfile = async (solanaAddress, profileData) => {
  try {
    const user = await prisma.user.update({
      where: { solanaAddress },
      data: {
        username: profileData.username || undefined,
        bio: profileData.bio || undefined,
        age: profileData.age || undefined,
        gender: profileData.gender || undefined,
        location: profileData.location || undefined
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

    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Example: How to check user verification status
const checkUserVerification = async (solanaAddress) => {
  try {
    const user = await prisma.user.findUnique({
      where: { solanaAddress },
      select: {
        id: true,
        verificationStatus: true,
        username: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      isVerified: user.verificationStatus === 'VERIFIED',
      verificationStatus: user.verificationStatus,
      username: user.username
    };
  } catch (error) {
    console.error('Verification check error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  loginWithSchema,
  registerWithSchema,
  getUserWithAnalysis,
  updateUserProfile,
  checkUserVerification
}; 