# Development Guide

## Solana Mobile Wallet Adapter Integration

This app uses Solana Mobile Wallet Adapter (MWA) 2.0 for wallet authentication. However, there are some important considerations for development:

### Development Mode (Expo Go)

When running in Expo Go, the native MWA modules are not available. The app includes a **fallback implementation** that:

- ✅ Simulates wallet connection
- ✅ Stores mock authentication data
- ✅ Provides the same user experience
- ✅ Works for UI/UX development and testing

### Production Mode (Development Build)

For full MWA functionality, you need to create a **development build**:

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure the project
eas build:configure

# Create a development build
eas build --profile development --platform android
# or
eas build --profile development --platform ios
```

### Testing Wallet Connection

#### In Expo Go (Development)
- Tap "Connect Wallet" → Mock connection succeeds
- Wallet address: `7xKXtg2CW87d97ZJZR6Qh4xexk7tXtJhtfcoQ3fhszti`
- No actual wallet app required

#### In Development Build (Production-like)
- Tap "Connect Wallet" → Opens actual MWA wallet app
- Real wallet authorization required
- Actual Solana wallet address returned

### Key Features

- **Fallback Detection**: Automatically detects Expo Go vs Development Build
- **Error Handling**: Graceful fallback when MWA is unavailable
- **Consistent API**: Same interface regardless of environment
- **Development Friendly**: No setup required for UI development

### File Structure

```
utils/
├── solanaWallet.js          # Main wallet integration
└── authSchema.js            # ❌ Removed (no longer needed)

app/
├── (auth)/
│   ├── signup.jsx          # ✅ Updated for wallet auth
│   └── signin.jsx          # ✅ Updated for wallet auth
└── (tabs)/
    └── profile.jsx         # ✅ Updated for wallet management
```

### Next Steps

1. **UI Development**: Use Expo Go for rapid UI iteration
2. **Wallet Testing**: Use Development Build for real wallet testing
3. **Production**: Deploy with Development Build for full MWA support

### Troubleshooting

- **"SolanaMobileWalletAdapter not found"**: Expected in Expo Go, use fallback
- **"Missing default export"**: Fixed in component files
- **Connection fails**: Check if running in Development Build for real wallet testing 