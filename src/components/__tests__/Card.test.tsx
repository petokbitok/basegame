import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../Card';
import { Suit, Rank } from '../../types';

/**
 * Unit tests for Card component
 * 
 * **Validates: Requirements 2.1, 2.2, 2.4, 2.5**
 * 
 * These tests verify specific examples and edge cases for card rendering:
 * - Face-up rendering with all suits
 * - Face-down rendering
 * - Animation class application
 */
describe('Card Component - Unit Tests', () => {
  describe('Face-up rendering with all suits', () => {
    it('should render a heart card face-up with red color', () => {
      const card = { suit: Suit.HEARTS, rank: Rank.ACE };
      render(<Card card={card} faceDown={false} />);
      
      const cardElement = screen.getByTestId('playing-card');
      expect(cardElement).toBeTruthy();
      expect(cardElement.className).toContain('text-card-red');
      expect(cardElement.textContent).toContain('A');
      expect(cardElement.textContent).toContain('♥');
    });

    it('should render a diamond card face-up with red color', () => {
      const card = { suit: Suit.DIAMONDS, rank: Rank.KING };
      render(<Card card={card} faceDown={false} />);
      
      const cardElement = screen.getByTestId('playing-card');
      expect(cardElement).toBeTruthy();
      expect(cardElement.className).toContain('text-card-red');
      expect(cardElement.textContent).toContain('K');
      expect(cardElement.textContent).toContain('♦');
    });

    it('should render a spade card face-up with black color', () => {
      const card = { suit: Suit.SPADES, rank: Rank.QUEEN };
      render(<Card card={card} faceDown={false} />);
      
      const cardElement = screen.getByTestId('playing-card');
      expect(cardElement).toBeTruthy();
      expect(cardElement.className).toContain('text-card-black');
      expect(cardElement.textContent).toContain('Q');
      expect(cardElement.textContent).toContain('♠');
    });

    it('should render a club card face-up with black color', () => {
      const card = { suit: Suit.CLUBS, rank: Rank.JACK };
      render(<Card card={card} faceDown={false} />);
      
      const cardElement = screen.getByTestId('playing-card');
      expect(cardElement).toBeTruthy();
      expect(cardElement.className).toContain('text-card-black');
      expect(cardElement.textContent).toContain('J');
      expect(cardElement.textContent).toContain('♣');
    });

    it('should render numeric ranks correctly', () => {
      const card = { suit: Suit.HEARTS, rank: Rank.TEN };
      render(<Card card={card} faceDown={false} />);
      
      const cardElement = screen.getByTestId('playing-card');
      expect(cardElement).toBeTruthy();
      expect(cardElement.textContent).toContain('10');
      expect(cardElement.textContent).toContain('♥');
    });

    it('should render low numeric ranks correctly', () => {
      const card = { suit: Suit.DIAMONDS, rank: Rank.TWO };
      render(<Card card={card} faceDown={false} />);
      
      const cardElement = screen.getByTestId('playing-card');
      expect(cardElement).toBeTruthy();
      expect(cardElement.textContent).toContain('2');
      expect(cardElement.textContent).toContain('♦');
    });
  });

  describe('Face-down rendering', () => {
    it('should render a card face-down with card back pattern', () => {
      const card = { suit: Suit.HEARTS, rank: Rank.ACE };
      const { container } = render(<Card card={card} faceDown={true} />);
      
      // Face-down cards should not have the playing-card test id
      const faceUpCard = container.querySelector('[data-testid="playing-card"]');
      expect(faceUpCard).toBeFalsy();
      
      // Should have blue gradient background
      const cardElement = container.querySelector('.bg-gradient-to-br');
      expect(cardElement).toBeTruthy();
      expect(cardElement?.className).toContain('from-blue-600');
      expect(cardElement?.className).toContain('to-blue-800');
      
      // Should show card back emoji
      expect(cardElement?.textContent).toContain('🃏');
    });

    it('should not reveal rank or suit when face-down', () => {
      const card = { suit: Suit.SPADES, rank: Rank.KING };
      const { container } = render(<Card card={card} faceDown={true} />);
      
      // Should not contain rank or suit symbols
      expect(container.textContent).not.toContain('K');
      expect(container.textContent).not.toContain('♠');
    });

    it('should render face-down for all suits', () => {
      const suits = [Suit.HEARTS, Suit.DIAMONDS, Suit.SPADES, Suit.CLUBS];
      
      suits.forEach(suit => {
        const card = { suit, rank: Rank.ACE };
        const { container } = render(<Card card={card} faceDown={true} />);
        
        // All face-down cards should look the same
        const cardElement = container.querySelector('.bg-gradient-to-br');
        expect(cardElement).toBeTruthy();
        expect(cardElement?.className).toContain('from-blue-600');
      });
    });
  });

  describe('Animation class application', () => {
    it('should apply animation class when animate is true', () => {
      const card = { suit: Suit.HEARTS, rank: Rank.ACE };
      render(<Card card={card} animate={true} />);
      
      const cardElement = screen.getByTestId('playing-card');
      expect(cardElement.className).toContain('animate-deal-card');
    });

    it('should not apply animation class when animate is false', () => {
      const card = { suit: Suit.HEARTS, rank: Rank.ACE };
      render(<Card card={card} animate={false} />);
      
      const cardElement = screen.getByTestId('playing-card');
      expect(cardElement.className).not.toContain('animate-deal-card');
    });

    it('should not apply animation class by default', () => {
      const card = { suit: Suit.HEARTS, rank: Rank.ACE };
      render(<Card card={card} />);
      
      const cardElement = screen.getByTestId('playing-card');
      expect(cardElement.className).not.toContain('animate-deal-card');
    });

    it('should apply animation delay style when provided', () => {
      const card = { suit: Suit.HEARTS, rank: Rank.ACE };
      render(<Card card={card} animate={true} animationDelay={200} />);
      
      const cardElement = screen.getByTestId('playing-card') as HTMLElement;
      expect(cardElement.style.animationDelay).toBe('200ms');
    });

    it('should apply animation to face-down cards', () => {
      const card = { suit: Suit.HEARTS, rank: Rank.ACE };
      const { container } = render(<Card card={card} faceDown={true} animate={true} />);
      
      const cardElement = container.querySelector('.animate-deal-card');
      expect(cardElement).toBeTruthy();
    });

    it('should apply animation delay to face-down cards', () => {
      const card = { suit: Suit.HEARTS, rank: Rank.ACE };
      const { container } = render(
        <Card card={card} faceDown={true} animate={true} animationDelay={300} />
      );
      
      const cardElement = container.querySelector('.bg-gradient-to-br') as HTMLElement;
      expect(cardElement?.style.animationDelay).toBe('300ms');
    });
  });

  describe('Null card rendering', () => {
    it('should render an empty card slot when card is null', () => {
      const { container } = render(<Card card={null} />);
      
      // Should render a dashed border placeholder
      const emptySlot = container.querySelector('.border-dashed');
      expect(emptySlot).toBeTruthy();
      expect(emptySlot?.className).toContain('border-gray-400');
      expect(emptySlot?.className).toContain('bg-transparent');
    });

    it('should not render playing card content when card is null', () => {
      const { container } = render(<Card card={null} />);
      
      const playingCard = container.querySelector('[data-testid="playing-card"]');
      expect(playingCard).toBeFalsy();
    });
  });

  describe('Card styling', () => {
    it('should have correct dimensions on desktop', () => {
      const card = { suit: Suit.HEARTS, rank: Rank.ACE };
      render(<Card card={card} />);
      
      const cardElement = screen.getByTestId('playing-card');
      // Check for responsive width classes (w-12 for mobile, md:w-14 for desktop)
      expect(cardElement.className).toContain('w-12');
      expect(cardElement.className).toContain('md:w-14');
    });

    it('should have rounded corners', () => {
      const card = { suit: Suit.HEARTS, rank: Rank.ACE };
      render(<Card card={card} />);
      
      const cardElement = screen.getByTestId('playing-card');
      expect(cardElement.className).toContain('rounded');
    });

    it('should have shadow for depth', () => {
      const card = { suit: Suit.HEARTS, rank: Rank.ACE };
      render(<Card card={card} />);
      
      const cardElement = screen.getByTestId('playing-card');
      expect(cardElement.className).toContain('shadow-md');
    });

    it('should have white background for face-up cards', () => {
      const card = { suit: Suit.HEARTS, rank: Rank.ACE };
      render(<Card card={card} />);
      
      const cardElement = screen.getByTestId('playing-card');
      expect(cardElement.className).toContain('bg-white');
    });
  });
});
