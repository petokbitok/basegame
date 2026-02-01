import { normalize } from 'viem/ens';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

// Base Mainnet ENS Registry address
const BASENAME_L2_RESOLVER_ADDRESS = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD';

/**
 * Get Basename for an address
 * @param address Ethereum address
 * @returns Basename or null if not found
 */
export async function getBasename(address: string): Promise<string | null> {
  try {
    const client = createPublicClient({
      chain: base,
      transport: http(),
    });

    // Get the primary name for the address
    const basename = await client.getEnsName({
      address: address as `0x${string}`,
    });

    return basename;
  } catch (error) {
    console.error('Error fetching Basename:', error);
    return null;
  }
}

/**
 * Format address or basename for display
 * @param address Ethereum address
 * @param basename Optional basename
 * @returns Formatted string
 */
export function formatAddressOrBasename(
  address: string,
  basename?: string | null
): string {
  if (basename) {
    return basename;
  }
  
  // Format address as 0x1234...5678
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Check if a string is a valid Basename
 * @param name String to check
 * @returns True if valid Basename format
 */
export function isValidBasename(name: string): boolean {
  try {
    // Basenames end with .base.eth
    if (!name.endsWith('.base.eth')) {
      return false;
    }
    
    // Try to normalize the name
    normalize(name);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get avatar URL for a Basename
 * @param basename Basename
 * @returns Avatar URL or null
 */
export async function getBasenameAvatar(basename: string): Promise<string | null> {
  try {
    const client = createPublicClient({
      chain: base,
      transport: http(),
    });

    const avatar = await client.getEnsAvatar({
      name: normalize(basename),
    });

    return avatar;
  } catch (error) {
    console.error('Error fetching Basename avatar:', error);
    return null;
  }
}
