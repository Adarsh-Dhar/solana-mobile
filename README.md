# DineTime - Solana Mobile App

A React Native restaurant discovery app with Solana wallet integration using Mobile Wallet Adapter (MWA) 2.0.

## Features

- **Solana Wallet Authentication**: Connect your Solana wallet to sign up and sign in
- **Mobile Wallet Adapter 2.0**: Secure communication between dApp and MWA-compliant wallet apps
- **Guest Mode**: Continue using the app without wallet connection
- **Restaurant Discovery**: Browse and explore restaurants
- **Modern UI**: Built with Tailwind CSS and NativeWind

## Authentication

This app uses Solana Mobile Wallet Adapter for authentication instead of traditional email/password:

### Wallet Connection
- Users can connect their Solana wallet for secure authentication
- Supports MWA-compliant wallet apps installed on the device
- Stores authentication tokens for seamless reconnection

### Guest Mode
- Users can continue as guests without wallet connection
- Limited functionality but full app access

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

3. Run on device/simulator:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app

## Dependencies

- `@solana-mobile/mobile-wallet-adapter-protocol-web3js`: MWA protocol wrapper
- `@solana-mobile/mobile-wallet-adapter-protocol`: Core MWA library
- `@solana/web3.js`: Solana web3 utilities
- `react-native-quick-base64`: Base64 encoding for React Native

## Architecture

- **Authentication**: Solana wallet-based using MWA 2.0
- **State Management**: AsyncStorage for persistent data
- **UI Framework**: React Native with Tailwind CSS
- **Navigation**: Expo Router with file-based routing

## Wallet Integration

The app uses Mobile Wallet Adapter to:
- Establish secure sessions with wallet apps
- Request wallet authorization
- Handle transaction signing (future feature)
- Manage authentication tokens

## Development

This project uses Expo with React Native and follows the file-based routing pattern. The authentication flow has been updated to use Solana wallets instead of Firebase authentication.

## Learn more

- [Solana Mobile Wallet Adapter](https://docs.solana.com/developing/mobile-wallet-adapter)
- [Expo documentation](https://docs.expo.dev/)
- [React Native](https://reactnative.dev/)
