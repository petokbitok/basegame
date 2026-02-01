# Poker AI Game 🎮

Texas Hold'em poker game with AI opponents on Base blockchain. Play against 5 AI players with full blockchain integration, gasless transactions, and leaderboard tracking.

## ✨ Features

### 🎯 Game Features
- **Texas Hold'em Poker**: Full implementation with proper betting rounds
- **5 AI Opponents**: Smart AI players with varying strategies
- **Real-time Game State**: Live updates and smooth gameplay
- **Responsive UI**: Optimized for desktop and mobile

### ⛓️ Base Blockchain Integration
- **Base Account**: Sign in with Base Account for seamless onboarding
- **Basename Support**: Display ENS names instead of addresses
- **Gasless Transactions**: Paymaster integration for sponsored transactions
- **Smart Contract Leaderboard**: Track wins and stats on-chain
- **Wallet Connect**: Support for multiple wallet providers

### 🎨 UI/UX
- **Modern Design**: Clean, poker-themed interface
- **Notifications**: Real-time feedback for all actions
- **Leaderboard**: View top players and your ranking
- **User Profiles**: Display Basename and avatar
- **Loading States**: Smooth transitions and loading indicators

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## ⚙️ Setup

1. **Environment Variables**: Create a `.env` file:
```bash
VITE_APP_URL=http://localhost:3000
VITE_CDP_PROJECT_ID=your-coinbase-developer-platform-project-id
VITE_LEADERBOARD_CONTRACT_ADDRESS=0x3bf4990d86fbf7083b10a636b8893f9a24b13e7b
VITE_BASE_RPC_URL=https://mainnet.base.org
VITE_PAYMASTER_URL=https://api.developer.coinbase.com/rpc/v1/base/paymaster
```

2. **Get CDP Project ID**: 
   - Visit [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
   - Create a new project
   - Copy your Project ID

3. **Deploy Contract** (Optional):
   - Contract is already deployed at `0x3bf4990d86fbf7083b10a636b8893f9a24b13e7b`
   - Or deploy your own using Remix IDE

## 🏗️ Tech Stack

### Frontend
- **React 19**: Latest React with concurrent features
- **TypeScript**: Full type safety
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling

### Blockchain
- **Base**: L2 blockchain by Coinbase
- **Wagmi v2**: React hooks for Ethereum
- **Viem**: TypeScript Ethereum library
- **OnchainKit**: Coinbase's web3 components
- **Base Account SDK**: Smart wallet integration

### Testing
- **Vitest**: Fast unit test framework
- **Fast-check**: Property-based testing
- **React Testing Library**: Component testing

## 📁 Project Structure

```
src/
├── ai/              # AI player logic
├── auth/            # Authentication services
├── blockchain/      # Smart contract integration
├── components/      # React components
├── config/          # Configuration
├── core/            # Game logic (deck, evaluator, betting)
├── engine/          # Game engine and flow
├── hooks/           # Custom React hooks
├── leaderboard/     # Leaderboard management
├── persistence/     # Game state persistence
├── types/           # TypeScript types
├── ui/              # UI components
└── utils/           # Utility functions
```

## 🎮 How to Play

1. **Connect Wallet**: Use Base Account (recommended) or any Web3 wallet
2. **Start Game**: Click "Join Table & Start Game"
3. **Play Poker**: Make decisions (Fold, Call, Raise, All-in)
4. **Track Progress**: View your stats in the leaderboard
5. **Save Progress**: Stats are saved locally and can be synced to blockchain

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

**Test Coverage**: 272 tests passing across:
- Unit tests for core game logic
- Property-based tests for invariants
- Integration tests for game flow
- Component tests for UI

## 🔧 Development

```bash
# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 Smart Contract

The leaderboard contract is deployed on Base mainnet:
- **Address**: `0x3bf4990d86fbf7083b10a636b8893f9a24b13e7b`
- **Features**: 
  - Track player statistics
  - Leaderboard rankings
  - Access control for game managers
  - Pausable for emergencies

## 🌟 Base Integration Highlights

### Base Account
- One-click sign-in with email or social
- No seed phrases or complex setup
- Smart wallet with session keys
- Gasless transactions via paymaster

### Basename
- Human-readable names on Base
- Automatic ENS resolution
- Avatar support
- Displayed throughout the UI

### Paymaster
- Sponsored transactions
- No gas fees for users
- Configurable spending limits
- Automatic retry logic

## 🚧 Roadmap

- [ ] MiniKit integration for social features
- [ ] USDC payment support for buy-ins
- [ ] Session keys for better UX
- [ ] Social sharing features
- [ ] Tournament mode
- [ ] Multiplayer support

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 🔗 Links

- [Base Documentation](https://docs.base.org/)
- [Base Account](https://docs.base.org/base-account/)
- [OnchainKit](https://onchainkit.xyz/)
- [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
