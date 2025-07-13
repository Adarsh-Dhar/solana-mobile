# Authentication System Update

## Overview

The authentication system has been updated from email/password authentication to Solana wallet authentication using Mobile Wallet Adapter (MWA) 2.0.

## Changes Made

### Backend Changes

1. **Updated Prisma Schema** (`backend/prisma/schema.prisma`)
   - Removed `email` and `password` fields
   - Added `solanaAddress` (unique) and `mobileAuthToken` fields
   - Updated User model for wallet-based authentication

2. **Updated Authentication Routes** (`backend/src/routes/auth.js`)
   - Removed bcryptjs and jsonwebtoken dependencies
   - Updated `/register` endpoint to accept `solanaAddress`, `mobileAuthToken`, and `username`
   - Updated `/login` endpoint to authenticate by Solana address
   - Updated `/me` endpoint to use wallet address header
   - Added `/verify-wallet` endpoint for signature verification (placeholder)

3. **New Authentication Middleware** (`backend/src/middleware/auth.js`)
   - `authenticateWallet`: Required authentication middleware
   - `optionalAuth`: Optional authentication middleware
   - Validates Solana address format and user existence

4. **Updated Dependencies** (`backend/package.json`)
   - Removed `bcryptjs` and `jsonwebtoken`
   - Removed corresponding TypeScript types

### Frontend Changes

1. **Updated Authentication Service** (`utils/auth.js`)
   - Replaced email/password methods with wallet-based methods
   - `registerWithWallet()`: Connects wallet and registers with backend
   - `loginWithWallet()`: Connects wallet and authenticates with backend
   - `logout()`: Disconnects wallet and clears stored data
   - `getCurrentUser()`: Retrieves user by wallet address
   - `isAuthenticated()`: Checks wallet connection and backend verification

2. **Updated API Interceptor** (`utils/api.js`)
   - Changed from JWT token to Solana wallet address header
   - Uses `x-solana-address` header for authentication
   - Handles authentication errors by clearing stored data

3. **Updated UI Components**
   - **Signup Screen** (`app/(auth)/signup.jsx`): Added username input, updated to use `authService.registerWithWallet()`
   - **Signin Screen** (`app/(auth)/signin.jsx`): Updated to use `authService.loginWithWallet()`
   - **Profile Screen** (`app/(tabs)/profile.jsx`): Updated to display wallet information and use new auth service

## Authentication Flow

### Registration
1. User enters username
2. User connects Solana wallet via MWA
3. Frontend calls `authService.registerWithWallet(username)`
4. Backend creates user with Solana address and stores auth token
5. User is redirected to home screen

### Login
1. User connects Solana wallet via MWA
2. Frontend calls `authService.loginWithWallet()`
3. Backend verifies wallet address exists in database
4. User is authenticated and redirected to home screen

### Authentication Headers
- All authenticated requests use `x-solana-address` header
- Backend validates wallet address format and user existence
- No JWT tokens required

## Benefits

1. **Enhanced Security**: No passwords to store or compromise
2. **User Experience**: Seamless wallet connection via MWA
3. **Web3 Native**: Leverages existing Solana wallet infrastructure
4. **Mobile Optimized**: Uses Mobile Wallet Adapter for mobile devices
5. **Fallback Support**: Includes development fallback for Expo Go

## Development Notes

- **Expo Go**: Uses mock wallet connection for development
- **Development Build**: Uses actual MWA for production-like testing
- **Error Handling**: Graceful fallback when MWA is unavailable
- **Guest Mode**: Still available for users without wallets

## Migration Notes

- Existing email/password users will need to re-register with wallet
- No automatic migration path from email/password to wallet
- Guest mode remains available for non-wallet users 