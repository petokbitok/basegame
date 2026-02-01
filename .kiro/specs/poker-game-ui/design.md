# Design Document: Texas Hold'em Poker Game UI

## Overview

This design document specifies the implementation of a complete Texas Hold'em poker game user interface built with React, TypeScript, and Tailwind CSS. The UI integrates with existing backend game logic (Game.ts, GameEngine, BettingSystem, HandEvaluator, AIPlayer) and provides blockchain integration via Base network using OnchainKit, wagmi, and Coinbase Paymaster for gasless transactions.

The system follows a component-based architecture where React components render the game state from the existing GameEngine, handle user interactions through the Game class, and synchronize results to the blockchain via LeaderboardManager.

### Key Design Principles

1. **Separation of Concerns**: UI components only handle presentation and user interaction; all game logic remains in existing backend classes
2. **State Synchronization**: UI polls GameEngine state and updates reactively
3. **Progressive Enhancement**: Core gameplay works without blockchain; blockchain features enhance the experience
4. **Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints
5. **Animation Performance**: CSS transitions and transforms for smooth 60fps animations

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         React UI Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PokerTable   │  │ Betting      │  │ Leaderboard  │      │
│  │ Component    │  │ Controls     │  │ Modal        │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                    Game Orchestration Layer                  │
│                     ┌──────▼───────┐                         │
│                     │  Game.ts     │                         │
│                     │  (existing)  │                         │
│                     └──────┬───────┘                         │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│  GameEngine    │  │   AIPlayer      │  │  Leaderboard   │
│  (existing)    │  │   (existing)    │  │  Manager       │
│                │  │                 │  │  (existing)    │
└────────────────┘  └─────────────────┘  └───────┬────────┘
                                                  │
                                         ┌────────▼────────┐
                                         │  Base Blockchain│
                                         │  (Paymaster)    │
                                         └─────────────────┘
```

### Component Hierarchy

```
App
├── Header
│   ├── Logo
│   ├── UserProfile (existing)
│   └── LeaderboardButton
├── PokerTable
│   ├── TableFelt
│   ├── PlayerPosition (x6)
│   │   ├── PlayerInfo
│   │   ├── ChipStack
│   │   ├── HoleCards (x2)
│   │   ├── ActionIndicator
│   │   └── DealerButton
│   ├── CommunityCards
│   │   └── Card (x5)
│   ├── PotDisplay
│   └── GameStageIndicator
├── BettingControls
│   ├── ActionButtons
│   │   ├── FoldButton
│   │   ├── CheckButton
│   │   ├── CallButton
│   │   ├── BetButton
│   │   └── RaiseButton
│   └── BetSlider
├── WinnerModal
│   ├── WinnerAnnouncement
│   ├── HandRanking
│   └── PotAmount
├── LeaderboardModal
│   ├── LeaderboardHeader
│   └── LeaderboardEntry (x10)
└── GameControls
    └── StartHandButton
```

## Components and Interfaces

### Core Components

#### 1. PokerTable Component

**Purpose**: Main container that renders the poker table and orchestrates all child components.

**Props**:
```typescript
interface PokerTableProps {
  game: Game;
  onAction: (action: PlayerAction) => void;
}
```

**State**:
```typescript
interface PokerTableState {
  gameState: GameState;
  isAnimating: boolean;
  showWinner: boolean;
  winnerInfo: WinnerInfo | null;
}
```

**Responsibilities**:
- Poll game state every 100ms during active gameplay
- Render 6 player positions in oval layout
- Display community cards in center
- Show pot and game stage
- Trigger animations for card dealing and chip movements

**Layout Strategy**:
- Use CSS Grid for positioning players around oval table
- Desktop (≥1024px): Full oval with all 6 positions visible
- Tablet (768-1023px): Compressed oval, smaller cards
- Mobile (<768px): Vertical stack with human player at bottom

#### 2. PlayerPosition Component

**Purpose**: Renders a single player's seat with cards, chips, and status.

**Props**:
```typescript
interface PlayerPositionProps {
  player: Player;
  isActive: boolean;
  isDealer: boolean;
  position: 'top' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom';
  isHuman: boolean;
}
```

**Rendering Logic**:
- Show player name and chip stack
- Render 2 hole cards (face-up for human, face-down for AI)
- Display dealer button if isDealer
- Show last action indicator (Fold, Check, Call, Bet, Raise)
- Highlight with border when isActive
- Gray out when folded
- Show "All-In" badge when player.isAllIn

#### 3. Card Component

**Purpose**: Renders a single playing card with suit and rank.

**Props**:
```typescript
interface CardProps {
  card: Card | null;
  faceDown?: boolean;
  animate?: boolean;
  animationDelay?: number;
}
```

**Rendering**:
- Card dimensions: 80px × 112px (desktop), 60px × 84px (mobile)
- Face-up: Show rank (A, 2-10, J, Q, K) and suit symbol (♠ ♥ ♦ ♣)
- Face-down: Show card back pattern
- Colors: Red for hearts/diamonds, black for spades/clubs
- Border radius: 8px
- Box shadow for depth

**Animation**:
```css
@keyframes dealCard {
  from {
    transform: translateY(-100px) scale(0.5);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}
```

#### 4. BettingControls Component

**Purpose**: Provides interactive controls for player actions.

**Props**:
```typescript
interface BettingControlsProps {
  player: Player;
  gameState: GameState;
  onAction: (action: PlayerAction) => void;
  disabled: boolean;
}
```

**State**:
```typescript
interface BettingControlsState {
  betAmount: number;
  minBet: number;
  maxBet: number;
}
```

**Button Visibility Logic**:
```typescript
const currentBet = Math.max(...gameState.players.map(p => p.currentBet));
const callAmount = currentBet - player.currentBet;

const showCheck = callAmount === 0;
const showCall = callAmount > 0;
const showBet = currentBet === 0;
const showRaise = currentBet > 0;
const showFold = true; // Always available
```

**Bet Slider**:
- Range: [minBet, player.chipStack]
- Step: bigBlind (e.g., 20)
- Display current value above slider
- Update in real-time as user drags

#### 5. CommunityCards Component

**Purpose**: Displays the 5 community cards in the center of the table.

**Props**:
```typescript
interface CommunityCardsProps {
  cards: Card[];
  stage: GameStage;
}
```

**Layout**:
- Horizontal row of 5 card slots
- Cards appear based on stage:
  - Pre-flop: 0 cards
  - Flop: 3 cards
  - Turn: 4 cards
  - River: 5 cards
- Empty slots shown as dashed outlines
- Cards animate in when dealt

#### 6. WinnerModal Component

**Purpose**: Displays winner announcement at end of hand.

**Props**:
```typescript
interface WinnerModalProps {
  winners: WinnerResult[];
  onClose: () => void;
}
```

**Display**:
- Modal overlay with semi-transparent background
- Winner name(s) in large text
- Hand ranking description (e.g., "Full House, Kings over Tens")
- Pot amount won
- Confetti animation for human player wins
- Auto-close after 3 seconds

#### 7. LeaderboardModal Component

**Purpose**: Shows top 10 players from blockchain.

**Props**:
```typescript
interface LeaderboardModalProps {
  leaderboardManager: LeaderboardManager;
  currentPlayerAddress: string;
  onClose: () => void;
}
```

**State**:
```typescript
interface LeaderboardModalState {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
}
```

**Data Fetching**:
```typescript
useEffect(() => {
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await leaderboardManager.getTopPlayers(10);
      setEntries(data);
    } catch (error) {
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };
  fetchLeaderboard();
}, []);
```

### Utility Hooks

#### useGameState Hook

**Purpose**: Manages game state synchronization and updates.

```typescript
function useGameState(game: Game) {
  const [gameState, setGameState] = useState<GameState>(game.getGameState());
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);

  useEffect(() => {
    // Poll game state every 100ms during active gameplay
    const interval = setInterval(() => {
      const newState = game.getGameState();
      setGameState(newState);
      
      const currentPlayer = newState.players[newState.activePlayer];
      setIsPlayerTurn(currentPlayer.isHuman);
    }, 100);

    return () => clearInterval(interval);
  }, [game]);

  return { gameState, isPlayerTurn };
}
```

#### useAnimations Hook

**Purpose**: Manages animation state and timing.

```typescript
function useAnimations() {
  const [isAnimating, setIsAnimating] = useState(false);

  const animateCardDeal = async (count: number) => {
    setIsAnimating(true);
    // Stagger card animations by 100ms each
    await new Promise(resolve => setTimeout(resolve, count * 100));
    setIsAnimating(false);
  };

  const animateChipMovement = async () => {
    setIsAnimating(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsAnimating(false);
  };

  return { isAnimating, animateCardDeal, animateChipMovement };
}
```

#### useLeaderboard Hook

**Purpose**: Manages blockchain leaderboard operations.

```typescript
function useLeaderboard(leaderboardManager: LeaderboardManager, playerAddress: string) {
  const [points, setPoints] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const saveResult = async (result: GameResult) => {
    setIsSaving(true);
    try {
      await leaderboardManager.updatePlayerStats({
        playerId: result.playerId,
        playerAddress: playerAddress,
        gameWon: result.won,
        handsWon: result.won ? 1 : 0,
        biggestPot: result.potSize,
      });
      
      // Refresh points from blockchain
      const newPoints = await leaderboardManager.getPlayerPoints(playerAddress);
      setPoints(newPoints);
    } catch (error) {
      console.error('Failed to save result:', error);
      // Retry logic handled by LeaderboardManager
    } finally {
      setIsSaving(false);
    }
  };

  return { points, isSaving, saveResult };
}
```

## Data Models

### Game State (from existing GameEngine)

```typescript
interface GameState {
  players: Player[];
  communityCards: Card[];
  pot: PotState;
  currentStage: GameStage;
  dealerPosition: number;
  activePlayer: number;
  bettingRound: number;
  handHistory: HandRecord[];
  authenticatedUser: User | null;
}
```

### Player (from existing types)

```typescript
interface Player {
  id: string;
  name: string;
  chipStack: number;
  holeCards: Card[];
  currentBet: number;
  position: Position;
  isActive: boolean;
  isAllIn: boolean;
  lastAction: PlayerAction | null;
  isHuman: boolean;
  baseAddress?: string;
}
```

### UI-Specific Models

```typescript
interface WinnerInfo {
  playerId: string;
  playerName: string;
  handRanking: string;
  potAmount: number;
}

interface LeaderboardEntry {
  rank: number;
  address: string;
  points: number;
  isCurrentPlayer: boolean;
}

interface AnimationState {
  type: 'card-deal' | 'chip-move' | 'winner-reveal';
  target: string;
  duration: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified the following testable properties and eliminated redundancy:

**Redundancy Analysis**:
- Properties 2.1, 2.2, 2.3 (card display for different player types) can be combined into a single comprehensive property about card visibility based on player type and game stage
- Properties 3.1 and 3.2 (chip stack and pot display) can be combined into a single property about numeric value display
- Properties 4.2 and 4.3 (button visibility based on bet state) can be combined into a single property about button availability
- Properties 6.2, 6.3, 6.7 (game state indicators) can be combined into a single property about state information display
- Properties 8.3, 8.6 (points display and update) can be combined into a single property about blockchain data synchronization
- Properties 9.1, 9.2 (leaderboard structure) can be combined into a single property about leaderboard data display

**Properties to Implement**:
1. Card visibility based on player type and game stage
2. Numeric formatting and display
3. Button availability based on game state
4. Player action processing through game engine
5. Game state information display
6. Winner information display
7. Blockchain transaction handling
8. Error handling and recovery

### Correctness Properties

Property 1: Card Visibility Rules
*For any* game state, hole cards should be displayed face-up for the human player, face-down for AI opponents (except at showdown), and community cards should always be face-up when present.
**Validates: Requirements 2.1, 2.2, 2.3, 2.7**

Property 2: Card Suit Rendering
*For any* card, the suit symbol (♠ ♥ ♦ ♣) should be rendered with the correct color (red for hearts/diamonds, black for spades/clubs).
**Validates: Requirements 2.4, 2.5**

Property 3: Numeric Value Formatting
*For any* numeric value (chip stacks, pot amounts, bet amounts), values ≥1000 should be formatted with comma separators (e.g., "1,000").
**Validates: Requirements 3.5**

Property 4: Player State Indicators
*For any* player, their current state (chip stack, last action, active/folded/all-in status) should be accurately displayed based on the game state.
**Validates: Requirements 3.1, 3.6, 6.3, 6.4, 6.5**

Property 5: Betting Control Availability
*For any* game state, the available betting actions (Check, Bet, Call, Raise, Fold) should match the valid actions determined by the BettingSystem based on current bet and player chips.
**Validates: Requirements 4.1, 4.2, 4.3, 4.7**

Property 6: Bet Amount Constraints
*For any* betting control state, the minimum and maximum bet amounts should match the constraints from the BettingSystem (min = big blind or current bet + big blind, max = player chip stack).
**Validates: Requirements 4.5, 4.8**

Property 7: Action Processing Integration
*For any* player action (Fold, Check, Call, Bet, Raise), clicking the corresponding button should call Game.processHumanAction() with the correct action type and amount.
**Validates: Requirements 4.6, 14.3**

Property 8: Game State Synchronization
*For any* game state change in the GameEngine, the UI should reflect the updated state within the polling interval (100ms).
**Validates: Requirements 13.2, 13.3**

Property 9: AI Turn Processing
*For any* game state where the active player is an AI opponent, the game should automatically process the AI's action without user interaction.
**Validates: Requirements 5.4, 13.4**

Property 10: Game Stage Progression
*For any* completed betting round, the game should advance to the next stage (Pre-flop → Flop → Turn → River → Showdown) and deal the appropriate community cards.
**Validates: Requirements 5.3, 5.5**

Property 11: Winner Display Completeness
*For any* hand result, the winner display should show all required information: winner name(s), hand ranking description, and pot amount(s).
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

Property 12: Blockchain Result Persistence
*For any* completed hand, the result should be saved to the blockchain via LeaderboardManager.updatePlayerStats() with correct game outcome data.
**Validates: Requirements 8.1, 14.7**

Property 13: Blockchain Data Display
*For any* player address, the displayed points should match the value returned from LeaderboardManager.getPlayerPoints() after successful transactions.
**Validates: Requirements 8.3, 8.6**

Property 14: Transaction State Indication
*For any* blockchain transaction, the UI should display appropriate loading/error/success states based on the transaction status.
**Validates: Requirements 8.4, 8.5**

Property 15: Leaderboard Data Structure
*For any* leaderboard fetch, the display should show exactly 10 entries (or fewer if less than 10 players exist), each containing address, points, and rank, with the current player highlighted if present.
**Validates: Requirements 9.1, 9.2, 9.3**

Property 16: Error Recovery
*For any* error (blockchain transaction failure, game engine error, wallet disconnection), the UI should display a user-friendly error message and provide recovery options without leaving the UI in an inconsistent state.
**Validates: Requirements 15.1, 15.2, 15.5, 15.7**

## Error Handling

### Error Classification

1. **Blockchain Errors**
   - Transaction rejection by user
   - Network errors (RPC failures)
   - Contract errors (insufficient gas, revert)
   - Paymaster failures

2. **Game Engine Errors**
   - Invalid action attempts
   - State inconsistencies
   - Validation failures

3. **UI Errors**
   - Component rendering errors
   - State update failures
   - Animation errors

### Error Handling Strategy

#### Error Boundaries

```typescript
class GameErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Game error:', error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}
```

#### Blockchain Error Handling

```typescript
async function handleBlockchainTransaction(
  operation: () => Promise<void>,
  retryCount: number = 3
): Promise<void> {
  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      await operation();
      return;
    } catch (error) {
      if (isUserRejection(error)) {
        // Don't retry user rejections
        throw new UserRejectionError('Transaction cancelled by user');
      }
      
      if (isNetworkError(error) && attempt < retryCount - 1) {
        // Retry network errors with exponential backoff
        await delay(Math.pow(2, attempt) * 1000);
        continue;
      }
      
      throw error;
    }
  }
}
```

#### Game Engine Error Handling

```typescript
function handleGameAction(action: PlayerAction): void {
  try {
    const result = game.processHumanAction(action.type, action.amount);
    
    if (!result.success) {
      showError({
        title: 'Invalid Action',
        message: result.error || 'This action is not allowed',
        type: 'warning',
      });
    }
  } catch (error) {
    showError({
      title: 'Game Error',
      message: 'An unexpected error occurred. Please try again.',
      type: 'error',
    });
    console.error('Game action error:', error);
  }
}
```

## Testing Strategy

### Dual Testing Approach

This project requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Component rendering with specific props
- User interaction flows (button clicks, slider changes)
- Error boundary behavior
- Blockchain integration mocking

**Property-Based Tests**: Verify universal properties across all inputs
- Card rendering for all possible card combinations
- Numeric formatting for all number ranges
- Button availability for all game states
- State synchronization for all state transitions

### Property-Based Testing Configuration

**Library**: fast-check (already used in the project based on memory-match-base)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: poker-game-ui, Property N: [property description]`

**Example Property Test**:

```typescript
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { formatChipAmount } from './utils';

describe('Feature: poker-game-ui, Property 3: Numeric Value Formatting', () => {
  it('should format numbers ≥1000 with comma separators', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 1000000 }),
        (amount) => {
          const formatted = formatChipAmount(amount);
          // Should contain at least one comma
          expect(formatted).toMatch(/,/);
          // Should parse back to original number
          expect(parseInt(formatted.replace(/,/g, ''))).toBe(amount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Examples

**Component Rendering**:
```typescript
describe('PokerTable Component', () => {
  it('should render 6 player positions', () => {
    const game = createMockGame();
    render(<PokerTable game={game} onAction={vi.fn()} />);
    
    const positions = screen.getAllByTestId('player-position');
    expect(positions).toHaveLength(6);
  });

  it('should show human player at bottom center', () => {
    const game = createMockGame();
    render(<PokerTable game={game} onAction={vi.fn()} />);
    
    const humanPosition = screen.getByTestId('player-position-human');
    expect(humanPosition).toHaveClass('bottom-center');
  });
});
```

**User Interactions**:
```typescript
describe('BettingControls Component', () => {
  it('should call onAction when Fold button is clicked', () => {
    const onAction = vi.fn();
    const player = createMockPlayer({ chipStack: 1000 });
    const gameState = createMockGameState();
    
    render(
      <BettingControls
        player={player}
        gameState={gameState}
        onAction={onAction}
        disabled={false}
      />
    );
    
    fireEvent.click(screen.getByText('Fold'));
    
    expect(onAction).toHaveBeenCalledWith({
      type: ActionType.FOLD,
      playerId: player.id,
    });
  });
});
```

**Blockchain Integration**:
```typescript
describe('Blockchain Integration', () => {
  it('should save game result to leaderboard', async () => {
    const mockLeaderboard = {
      updatePlayerStats: vi.fn().mockResolvedValue(undefined),
    };
    
    const { result } = renderHook(() =>
      useLeaderboard(mockLeaderboard as any, '0x123')
    );
    
    await act(async () => {
      await result.current.saveResult({
        playerId: 'human',
        won: true,
        potSize: 500,
      });
    });
    
    expect(mockLeaderboard.updatePlayerStats).toHaveBeenCalledWith({
      playerId: 'human',
      playerAddress: '0x123',
      gameWon: true,
      handsWon: 1,
      biggestPot: 500,
    });
  });
});
```

### Integration Testing

**Game Flow Integration**:
```typescript
describe('Complete Hand Flow', () => {
  it('should complete a full hand from deal to showdown', async () => {
    const game = new Game(5, 1000, 10, 20);
    const { rerender } = render(<PokerTable game={game} onAction={vi.fn()} />);
    
    // Start hand
    act(() => {
      game.startGame();
    });
    
    // Verify cards dealt
    expect(screen.getAllByTestId('hole-card')).toHaveLength(2);
    
    // Human player folds
    fireEvent.click(screen.getByText('Fold'));
    
    // Wait for AI to complete hand
    await waitFor(() => {
      expect(screen.getByTestId('winner-modal')).toBeInTheDocument();
    });
  });
});
```

## Implementation Notes

### Performance Considerations

1. **State Polling**: 100ms polling interval balances responsiveness with performance
2. **Animation Performance**: Use CSS transforms and opacity for GPU acceleration
3. **Component Memoization**: Memoize expensive components (Card, PlayerPosition) with React.memo
4. **Lazy Loading**: Lazy load LeaderboardModal to reduce initial bundle size

### Accessibility

1. **Keyboard Navigation**: All interactive elements accessible via keyboard
2. **Screen Reader Support**: ARIA labels for game state and player information
3. **Color Contrast**: Ensure WCAG AA compliance for text and UI elements
4. **Focus Management**: Proper focus handling for modals and betting controls

### Browser Compatibility

- Target: Modern browsers (Chrome, Firefox, Safari, Edge) - last 2 versions
- Mobile: iOS Safari 14+, Chrome Android 90+
- Polyfills: Not required (Vite handles this)

### Deployment Considerations

1. **Environment Variables**: Same as memory-match-base project
   - VITE_ONCHAINKIT_API_KEY
   - VITE_WALLETCONNECT_PROJECT_ID
   - VITE_NETWORK=mainnet
   - VITE_CHAIN_ID=8453
   - VITE_CONTRACT_ADDRESS (leaderboard contract)

2. **Build Optimization**:
   - Code splitting for modals
   - Image optimization for card assets
   - CSS purging with Tailwind

3. **Monitoring**:
   - Error tracking for blockchain failures
   - Performance monitoring for animation frame rates
   - Analytics for user engagement

## Appendix: Tailwind CSS Utilities

### Custom Poker Theme

```javascript
// tailwind.config.js additions
module.exports = {
  theme: {
    extend: {
      colors: {
        'poker-green': '#0a5f38',
        'poker-green-dark': '#064429',
        'poker-felt': '#1a7a4a',
        'card-red': '#dc2626',
        'card-black': '#1f2937',
      },
      animation: {
        'deal-card': 'dealCard 0.3s ease-out',
        'chip-move': 'chipMove 0.5s ease-in-out',
        'winner-pulse': 'pulse 1s ease-in-out infinite',
      },
      keyframes: {
        dealCard: {
          '0%': { transform: 'translateY(-100px) scale(0.5)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        chipMove: {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
};
```

### Responsive Breakpoints

- `sm`: 640px (mobile landscape)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

### Common Utility Patterns

```css
/* Player Position Layout */
.player-position {
  @apply absolute flex flex-col items-center gap-2;
}

.player-position-top {
  @apply top-4 left-1/2 -translate-x-1/2;
}

.player-position-bottom {
  @apply bottom-4 left-1/2 -translate-x-1/2;
}

/* Card Styling */
.card {
  @apply w-20 h-28 rounded-lg border-2 border-gray-300 bg-white shadow-lg;
  @apply flex items-center justify-center text-2xl font-bold;
}

.card-back {
  @apply bg-gradient-to-br from-blue-600 to-blue-800;
}

/* Betting Button */
.bet-button {
  @apply px-6 py-3 rounded-xl font-semibold text-white;
  @apply transition-all duration-200 transform hover:scale-105;
  @apply disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none;
}
```
