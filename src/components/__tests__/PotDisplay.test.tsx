import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PotDisplay } from '../PotDisplay';
import type { PotState } from '../../types';

/**
 * Unit tests for PotDisplay component
 * 
 * **Validates: Requirements 3.2**
 * 
 * These tests verify specific examples for pot display:
 * - Pot amount formatting
 * - Display structure and styling
 */
describe('PotDisplay Component - Unit Tests', () => {
  describe('Pot amount formatting', () => {
    it('should display formatted pot amount with dollar sign', () => {
      const pot: PotState = {
        mainPot: 500,
        sidePots: [],
        totalPot: 500,
      };
      
      render(<PotDisplay pot={pot} />);
      
      expect(screen.getByText('$500')).toBeTruthy();
    });

    it('should format large pot amounts with commas', () => {
      const pot: PotState = {
        mainPot: 5000,
        sidePots: [],
        totalPot: 5000,
      };
      
      render(<PotDisplay pot={pot} />);
      
      expect(screen.getByText('$5,000')).toBeTruthy();
    });

    it('should format very large pot amounts correctly', () => {
      const pot: PotState = {
        mainPot: 1234567,
        sidePots: [],
        totalPot: 1234567,
      };
      
      render(<PotDisplay pot={pot} />);
      
      expect(screen.getByText('$1,234,567')).toBeTruthy();
    });

    it('should display zero pot correctly', () => {
      const pot: PotState = {
        mainPot: 0,
        sidePots: [],
        totalPot: 0,
      };
      
      render(<PotDisplay pot={pot} />);
      
      expect(screen.getByText('$0')).toBeTruthy();
    });

    it('should use totalPot for display', () => {
      const pot: PotState = {
        mainPot: 300,
        sidePots: [{ amount: 200, eligiblePlayers: ['player1', 'player2'] }],
        totalPot: 500,
      };
      
      render(<PotDisplay pot={pot} />);
      
      // Should display totalPot, not mainPot
      expect(screen.getByText('$500')).toBeTruthy();
    });
  });

  describe('Display structure', () => {
    it('should display "Pot" label', () => {
      const pot: PotState = {
        mainPot: 100,
        sidePots: [],
        totalPot: 100,
      };
      
      render(<PotDisplay pot={pot} />);
      
      expect(screen.getByText('Pot')).toBeTruthy();
    });

    it('should display poker chip icon', () => {
      const pot: PotState = {
        mainPot: 100,
        sidePots: [],
        totalPot: 100,
      };
      
      const { container } = render(<PotDisplay pot={pot} />);
      
      expect(container.textContent).toContain('🪙');
    });

    it('should have proper styling classes', () => {
      const pot: PotState = {
        mainPot: 100,
        sidePots: [],
        totalPot: 100,
      };
      
      const { container } = render(<PotDisplay pot={pot} />);
      
      const potDisplay = container.firstChild as HTMLElement;
      expect(potDisplay.className).toContain('rounded-lg');
      expect(potDisplay.className).toContain('shadow-md');
    });
  });

  describe('Edge cases', () => {
    it('should handle small pot amounts', () => {
      const pot: PotState = {
        mainPot: 10,
        sidePots: [],
        totalPot: 10,
      };
      
      render(<PotDisplay pot={pot} />);
      
      expect(screen.getByText('$10')).toBeTruthy();
    });

    it('should handle pot with multiple side pots', () => {
      const pot: PotState = {
        mainPot: 100,
        sidePots: [
          { amount: 50, eligiblePlayers: ['player1', 'player2'] },
          { amount: 30, eligiblePlayers: ['player1'] },
        ],
        totalPot: 180,
      };
      
      render(<PotDisplay pot={pot} />);
      
      expect(screen.getByText('$180')).toBeTruthy();
    });
  });
});
