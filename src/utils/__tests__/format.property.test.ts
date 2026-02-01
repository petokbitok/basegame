import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { formatChipAmount } from '../format';

describe('Feature: poker-game-ui, Property 3: Numeric Value Formatting', () => {
  /**
   * **Validates: Requirements 3.5**
   * 
   * For any numeric value ≥1000, the formatted string should contain comma separators
   */
  it('should format numbers ≥1000 with comma separators', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 10000000 }),
        (amount) => {
          const formatted = formatChipAmount(amount);
          
          // Should contain at least one comma
          expect(formatted).toMatch(/,/);
          
          // Should parse back to original number
          const parsed = parseInt(formatted.replace(/,/g, ''));
          expect(parsed).toBe(amount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any numeric value <1000, the formatted string should not contain commas
   */
  it('should format numbers <1000 without comma separators', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 999 }),
        (amount) => {
          const formatted = formatChipAmount(amount);
          
          // Should not contain commas
          expect(formatted).not.toMatch(/,/);
          
          // Should equal the string representation of the number
          expect(formatted).toBe(amount.toString());
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any numeric value, formatting should be reversible
   */
  it('should be reversible for all numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000000 }),
        (amount) => {
          const formatted = formatChipAmount(amount);
          const parsed = parseInt(formatted.replace(/,/g, ''));
          
          expect(parsed).toBe(amount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
