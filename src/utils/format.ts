/**
 * Format chip amount with comma separators for thousands
 * @param amount - The chip amount to format
 * @returns Formatted string with commas (e.g., "1,000")
 */
export function formatChipAmount(amount: number): string {
  return amount.toLocaleString('en-US');
}

/**
 * Truncate Ethereum address for display
 * @param address - Full Ethereum address
 * @returns Truncated address (e.g., "0x1234...5678")
 */
export function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
