# Implementation Plan: Texas Hold'em Poker Game UI

## Overview

This implementation plan breaks down the poker game UI into incremental coding tasks. Each task builds on previous work, with testing integrated throughout. The implementation uses existing backend logic (Game.ts, GameEngine, etc.) and focuses solely on UI components and blockchain integration.

## Tasks

- [x] 1. Set up utility functions and custom hooks
  - Create formatChipAmount() utility for number formatting with commas
  - Create useGameState() hook for polling game state from Game class
  - Create useAnimations() hook for managing animation states
  - Set up TypeScript interfaces for UI-specific models (WinnerInfo, LeaderboardEntry, AnimationState)
  - _Requirements: 3.5, 13.2, 13.3_

- [x] 1.1 Write property test for number formatting
  - **Property 3: Numeric Value Formatting**
  - **Validates: Requirements 3.5**

- [ ] 2. Implement Card component
  - [x] 2.1 Create Card component with props (card, faceDown, animate, animationDelay)
    - Render card with rank and suit symbol when face-up
    - Render card back pattern when faceDown=true
    - Apply red color for hearts/diamonds, black for spades/clubs
    - Add CSS classes for card styling (80px × 112px desktop, 60px × 84px mobile)
    - Add animation classes for dealing motion
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 2.2 Write property test for card suit rendering
    - **Property 2: Card Suit Rendering**
    - **Validates: Requirements 2.4, 2.5**

  - [x] 2.3 Write unit tests for Card component
    - Test face-up rendering with all suits
    - Test face-down rendering
    - Test animation class application
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [ ] 3. Implement PlayerPosition component
  - [x] 3.1 Create PlayerPosition component
    - Accept props: player, isActive, isDealer, position, isHuman
    - Display player name and formatted chip stack
    - Render 2 Card components (face-up for human, face-down for AI)
    - Show dealer button indicator when isDealer=true
    - Display last action indicator (Fold, Check, Call, Bet, Raise)
    - Apply highlight border when isActive=true
    - Gray out position when player.isActive=false
    - Show "All-In" badge when player.isAllIn=true
    - _Requirements: 3.1, 3.6, 6.3, 6.4, 6.5_

  - [x] 3.2 Write property test for player state indicators
    - **Property 4: Player State Indicators**
    - **Validates: Requirements 3.1, 3.6, 6.3, 6.4, 6.5**

  - [x] 3.3 Write unit tests for PlayerPosition component
    - Test dealer button visibility
    - Test active player highlighting
    - Test folded player styling
    - Test all-in badge display
    - _Requirements: 6.3, 6.4, 6.5_

- [ ] 4. Implement CommunityCards component
  - [x] 4.1 Create CommunityCards component
    - Accept props: cards (Card[]), stage (GameStage)
    - Render 5 card slots in horizontal row
    - Show empty slots as dashed outlines
    - Render Card components for dealt cards
    - Apply staggered animation delays for card dealing
    - _Requirements: 2.3_

  - [x] 4.2 Write property test for card visibility
    - **Property 1: Card Visibility Rules**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.7**

- [ ] 5. Implement PotDisplay and GameStageIndicator components
  - [x] 5.1 Create PotDisplay component
    - Accept props: pot (PotState)
    - Display formatted total pot amount in center
    - Style with poker chip icon and large text
    - _Requirements: 3.2_

  - [x] 5.2 Create GameStageIndicator component
    - Accept props: stage (GameStage), currentBet (number)
    - Display current stage name (Pre-flop, Flop, Turn, River, Showdown)
    - Show current bet amount that must be matched
    - _Requirements: 6.2, 6.7_

  - [x] 5.3 Write unit tests for display components
    - Test pot amount formatting
    - Test stage name display
    - Test current bet display
    - _Requirements: 3.2, 6.2, 6.7_

- [x] 6. Checkpoint - Verify component rendering
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement BettingControls component
  - [x] 7.1 Create BettingControls component structure
    - Accept props: player, gameState, onAction, disabled
    - Set up state for betAmount, minBet, maxBet
    - Calculate button visibility based on current bet
    - Render action buttons (Fold, Check, Call, Bet, Raise)
    - Implement bet slider with min/max constraints
    - Display call amount and bet range
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 4.8_

  - [x] 7.2 Implement button click handlers
    - Handle Fold: call onAction with ActionType.FOLD
    - Handle Check: call onAction with ActionType.CHECK
    - Handle Call: call onAction with ActionType.CALL and callAmount
    - Handle Bet: call onAction with ActionType.BET and betAmount
    - Handle Raise: call onAction with ActionType.RAISE and betAmount
    - _Requirements: 4.6_

  - [x] 7.3 Write property test for button availability
    - **Property 5: Betting Control Availability**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.7**

  - [x] 7.4 Write property test for bet amount constraints
    - **Property 6: Bet Amount Constraints**
    - **Validates: Requirements 4.5, 4.8**

  - [x] 7.5 Write unit tests for BettingControls
    - Test button visibility with no bet
    - Test button visibility with existing bet
    - Test button click handlers
    - Test disabled state
    - Test slider constraints
    - _Requirements: 4.1, 4.2, 4.3, 4.6, 4.7_

- [ ] 8. Implement PokerTable component
  - [x] 8.1 Create PokerTable component structure
    - Accept props: game, onAction
    - Use useGameState hook to poll game state
    - Set up CSS Grid layout for oval table
    - Position 6 PlayerPosition components around table
    - Place human player at bottom center
    - Distribute 5 AI players around table
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 8.2 Integrate child components
    - Render CommunityCards in center
    - Render PotDisplay below community cards
    - Render GameStageIndicator at top
    - Pass game state data to all child components
    - _Requirements: 2.3, 3.2, 6.2_

  - [x] 8.3 Add responsive styling
    - Desktop (≥1024px): Full oval layout
    - Tablet (768-1023px): Compressed oval
    - Mobile (<768px): Vertical stack
    - Apply Tailwind breakpoints
    - _Requirements: 1.6, 11.1, 11.2, 11.3_

  - [x] 8.4 Write property test for game state synchronization
    - **Property 8: Game State Synchronization**
    - **Validates: Requirements 13.2, 13.3**

  - [x] 8.5 Write unit tests for PokerTable
    - Test 6 player positions rendered
    - Test human player at bottom
    - Test dealer button positioning
    - Test component integration
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 9. Implement game flow integration
  - [x] 9.1 Create GameControls component
    - Add "Start New Hand" button
    - Show button only when no hand is in progress
    - Call game.startNewHand() on click
    - _Requirements: 5.1, 5.2_

  - [x] 9.2 Implement action processing in PokerTable
    - Create handleAction function that calls game.processHumanAction()
    - Pass handleAction to BettingControls as onAction prop
    - Handle action results and update UI
    - _Requirements: 4.6, 14.3_

  - [x] 9.3 Implement AI turn processing
    - Detect when active player is AI
    - Wait for game engine to process AI action automatically
    - Update UI after AI action completes
    - _Requirements: 5.4, 13.4_

  - [x] 9.4 Write property test for action processing
    - **Property 7: Action Processing Integration**
    - **Validates: Requirements 4.6, 14.3**

  - [x] 9.5 Write property test for AI turn processing
    - **Property 9: AI Turn Processing**
    - **Validates: Requirements 5.4, 13.4**

  - [x] 9.6 Write integration tests for game flow
    - Test starting new hand
    - Test human action processing
    - Test AI turn automation
    - Test game stage progression
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 10. Checkpoint - Verify core gameplay
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement WinnerModal component
  - [x] 11.1 Create WinnerModal component
    - Accept props: winners (WinnerResult[]), onClose
    - Display modal overlay with semi-transparent background
    - Show winner name(s) in large text
    - Display hand ranking description
    - Show pot amount won
    - Handle split pots (multiple winners)
    - Add close button and auto-close after 3 seconds
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_

  - [x] 11.2 Integrate WinnerModal into PokerTable
    - Detect when hand reaches showdown
    - Get winner results from game engine
    - Show WinnerModal with winner data
    - Reset table state after modal closes
    - _Requirements: 5.6, 5.7, 5.8_

  - [x] 11.3 Write property test for winner display
    - **Property 11: Winner Display Completeness**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

  - [x] 11.4 Write unit tests for WinnerModal
    - Test single winner display
    - Test split pot display
    - Test hand ranking formatting
    - Test auto-close timing
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_

- [ ] 12. Implement blockchain integration
  - [x] 12.1 Create useLeaderboard hook
    - Accept leaderboardManager and playerAddress
    - Implement saveResult function that calls leaderboardManager.updatePlayerStats()
    - Track points state from blockchain
    - Track isSaving state for loading indicator
    - Handle errors with retry logic
    - _Requirements: 8.1, 8.2, 8.4, 8.5_

  - [x] 12.2 Integrate blockchain saving into game flow
    - Call saveResult when hand ends
    - Pass game result data (winner, pot size)
    - Show loading indicator during save
    - Display error message on failure
    - Update displayed points after success
    - _Requirements: 8.1, 8.3, 8.4, 8.5, 8.6_

  - [x] 12.3 Write property test for blockchain result persistence
    - **Property 12: Blockchain Result Persistence**
    - **Validates: Requirements 8.1, 14.7**

  - [x] 12.4 Write property test for blockchain data display
    - **Property 13: Blockchain Data Display**
    - **Validates: Requirements 8.3, 8.6**

  - [x] 12.5 Write property test for transaction state indication
    - **Property 14: Transaction State Indication**
    - **Validates: Requirements 8.4, 8.5**

  - [x] 12.6 Write unit tests for blockchain integration
    - Test saveResult calls updatePlayerStats
    - Test loading state during save
    - Test error handling and retry
    - Test points update after success
    - _Requirements: 8.1, 8.3, 8.4, 8.5, 8.6_

- [ ] 13. Implement LeaderboardModal component
  - [x] 13.1 Create LeaderboardModal component
    - Accept props: leaderboardManager, currentPlayerAddress, onClose
    - Set up state for entries, loading, error
    - Fetch top 10 players on mount
    - Display loading state while fetching
    - Show error message on fetch failure
    - Render leaderboard entries with rank, address, points
    - Highlight current player's entry
    - Add close button
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 13.2 Add leaderboard button to header
    - Add button to open LeaderboardModal
    - Position in header next to UserProfile
    - _Requirements: 9.4_

  - [x] 13.3 Write property test for leaderboard data structure
    - **Property 15: Leaderboard Data Structure**
    - **Validates: Requirements 9.1, 9.2, 9.3**

  - [x] 13.4 Write unit tests for LeaderboardModal
    - Test data fetching on mount
    - Test loading state display
    - Test error state display
    - Test entry rendering
    - Test current player highlighting
    - _Requirements: 9.1, 9.2, 9.3, 9.5, 9.6_

- [ ] 14. Implement error handling
  - [x] 14.1 Create GameErrorBoundary component
    - Implement error boundary with getDerivedStateFromError
    - Catch and log errors
    - Display ErrorDisplay component with retry option
    - _Requirements: 15.7_

  - [x] 14.2 Create error handling utilities
    - Implement handleBlockchainTransaction with retry logic
    - Implement handleGameAction with error display
    - Create error classification functions (isUserRejection, isNetworkError)
    - _Requirements: 15.1, 15.2, 15.5_

  - [x] 14.3 Integrate error handling throughout app
    - Wrap PokerTable in GameErrorBoundary
    - Use handleBlockchainTransaction for all blockchain operations
    - Use handleGameAction for all game actions
    - Display user-friendly error messages
    - _Requirements: 15.1, 15.2, 15.5, 15.7_

  - [x] 14.4 Write property test for error recovery
    - **Property 16: Error Recovery**
    - **Validates: Requirements 15.1, 15.2, 15.5, 15.7**

  - [x] 14.5 Write unit tests for error handling
    - Test error boundary catches errors
    - Test blockchain error retry logic
    - Test user rejection handling
    - Test network error handling
    - Test game action error display
    - _Requirements: 15.1, 15.2, 15.5, 15.7_

- [ ] 15. Add animations and polish
  - [x] 15.1 Implement card dealing animations
    - Add CSS keyframes for dealCard animation
    - Apply animation to Card component with staggered delays
    - Use useAnimations hook to manage animation state
    - _Requirements: 2.6, 10.1_

  - [x] 15.2 Implement chip movement animations
    - Add CSS keyframes for chipMove animation
    - Animate chips when betting
    - Animate chips when winning
    - _Requirements: 3.3, 3.4, 10.2, 10.3_

  - [x] 15.3 Add winner celebration effects
    - Implement confetti animation for human player wins
    - Add winner highlight pulse animation
    - _Requirements: 7.5, 10.4_

  - [x] 15.4 Optimize animation performance
    - Use CSS transforms and opacity for GPU acceleration
    - Memoize Card and PlayerPosition components with React.memo
    - Ensure 60fps animation performance
    - _Requirements: 10.5, 10.6_

- [ ] 16. Final integration and testing
  - [x] 16.1 Update App.tsx to use PokerTable
    - Replace placeholder UI with PokerTable component
    - Pass game instance and action handler
    - Integrate LeaderboardModal
    - Add error boundary
    - _Requirements: 14.1, 14.2, 14.4, 14.5, 14.6, 14.7, 14.8_

  - [x] 16.2 Add Tailwind custom theme
    - Add poker-green colors to tailwind.config.js
    - Add custom animations (deal-card, chip-move, winner-pulse)
    - Add custom keyframes
    - _Requirements: 1.4_

  - [x] 16.3 Test complete game flow end-to-end
    - Start new hand
    - Play through all betting rounds
    - Verify AI turns process automatically
    - Verify winner display
    - Verify blockchain save
    - Verify leaderboard update
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 8.1, 8.6_

  - [x] 16.4 Run all property-based tests
    - Verify all 16 properties pass with 100+ iterations
    - Fix any failures
    - Ensure comprehensive coverage

  - [x] 16.5 Run full test suite
    - Verify all unit tests pass
    - Verify all integration tests pass
    - Check test coverage
    - Fix any failing tests

- [x] 17. Final checkpoint - Complete verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end flows
- All blockchain operations use existing LeaderboardManager and PaymasterService
- All game logic uses existing Game, GameEngine, BettingSystem, HandEvaluator, AIPlayer classes
- UI components only handle presentation and user interaction
- State synchronization via polling (100ms interval) during active gameplay
