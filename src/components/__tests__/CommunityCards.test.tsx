import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommunityCards } from '../CommunityCards';
import { Card, GameStage, Suit, Rank } from '../../types';

describe('CommunityCards Component', () => {
  const createCard = (rank: Rank, suit: Suit): Card => ({ rank, suit });

  const sampleCards: Card[] = [
    createCard(Rank.ACE, Suit.SPADES),
    createCard(Rank.KING, Suit.HEARTS),
    createCard(Rank.QUEEN, Suit.DIAMONDS),
    createCard(Rank.JACK, Suit.CLUBS),
    createCard(Rank.TEN, Suit.SPADES),
  ];

  it('should render 5 card slots', () => {
    render(<CommunityCards cards={[]} stage={GameStage.PRE_FLOP} />);
    
    const container = screen.getByTestId('community-cards');
    // Each slot is either a card or an empty slot (dashed border div)
    expect(container.children).toHaveLength(5);
  });

  it('should show empty slots as dashed outlines in pre-flop', () => {
    render(<CommunityCards cards={[]} stage={GameStage.PRE_FLOP} />);
    
    const container = screen.getByTestId('community-cards');
    const emptySlots = container.querySelectorAll('.border-dashed');
    expect(emptySlots).toHaveLength(5);
  });

  it('should show 3 cards during flop stage', () => {
    render(<CommunityCards cards={sampleCards} stage={GameStage.FLOP} />);
    
    const playingCards = screen.getAllByTestId('playing-card');
    expect(playingCards).toHaveLength(3);
    
    const container = screen.getByTestId('community-cards');
    const emptySlots = container.querySelectorAll('.border-dashed');
    expect(emptySlots).toHaveLength(2);
  });

  it('should show 4 cards during turn stage', () => {
    render(<CommunityCards cards={sampleCards} stage={GameStage.TURN} />);
    
    const playingCards = screen.getAllByTestId('playing-card');
    expect(playingCards).toHaveLength(4);
    
    const container = screen.getByTestId('community-cards');
    const emptySlots = container.querySelectorAll('.border-dashed');
    expect(emptySlots).toHaveLength(1);
  });

  it('should show 5 cards during river stage', () => {
    render(<CommunityCards cards={sampleCards} stage={GameStage.RIVER} />);
    
    const playingCards = screen.getAllByTestId('playing-card');
    expect(playingCards).toHaveLength(5);
    
    const container = screen.getByTestId('community-cards');
    const emptySlots = container.querySelectorAll('.border-dashed');
    expect(emptySlots).toHaveLength(0);
  });

  it('should show 5 cards during showdown stage', () => {
    render(<CommunityCards cards={sampleCards} stage={GameStage.SHOWDOWN} />);
    
    const playingCards = screen.getAllByTestId('playing-card');
    expect(playingCards).toHaveLength(5);
  });

  it('should render cards in horizontal row', () => {
    render(<CommunityCards cards={sampleCards} stage={GameStage.RIVER} />);
    
    const container = screen.getByTestId('community-cards');
    expect(container).toHaveClass('flex');
    expect(container).toHaveClass('justify-center');
  });

  it('should apply staggered animation delays', () => {
    render(<CommunityCards cards={sampleCards} stage={GameStage.FLOP} />);
    
    const container = screen.getByTestId('community-cards');
    const cards = container.children;
    
    // First card should have 0ms delay
    expect(cards[0]).toHaveStyle({ animationDelay: '0ms' });
    // Second card should have 100ms delay
    expect(cards[1]).toHaveStyle({ animationDelay: '100ms' });
    // Third card should have 200ms delay
    expect(cards[2]).toHaveStyle({ animationDelay: '200ms' });
  });

  it('should handle partial card arrays', () => {
    const partialCards = [
      createCard(Rank.ACE, Suit.SPADES),
      createCard(Rank.KING, Suit.HEARTS),
    ];
    
    render(<CommunityCards cards={partialCards} stage={GameStage.FLOP} />);
    
    // Should show 2 cards and 3 empty slots
    const playingCards = screen.getAllByTestId('playing-card');
    expect(playingCards).toHaveLength(2);
    
    const container = screen.getByTestId('community-cards');
    const emptySlots = container.querySelectorAll('.border-dashed');
    expect(emptySlots).toHaveLength(3);
  });

  it('should handle empty cards array', () => {
    render(<CommunityCards cards={[]} stage={GameStage.RIVER} />);
    
    // Should show 5 empty slots even though stage is river
    const container = screen.getByTestId('community-cards');
    const emptySlots = container.querySelectorAll('.border-dashed');
    expect(emptySlots).toHaveLength(5);
  });
});
