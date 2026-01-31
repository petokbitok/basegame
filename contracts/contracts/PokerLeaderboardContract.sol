// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PokerLeaderboardContract
 * @dev Manages poker leaderboard statistics on-chain
 * @notice This contract stores player game statistics (games won, hands won, biggest pot)
 * Chip balances are NOT stored on-chain - they are managed locally in the application
 */
contract PokerLeaderboardContract is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant GAME_MANAGER_ROLE = keccak256("GAME_MANAGER_ROLE");
    
    // Constants for gas optimization
    uint256 public constant MAX_LEADERBOARD_SIZE = 100;
    
    // Player statistics
    struct PlayerStats {
        uint256 points;
        uint256 gamesWon;
        uint256 handsWon;
        uint256 biggestPot;
        uint256 lastUpdated;
    }
    
    mapping(address => PlayerStats) private playerStats;
    
    // Leaderboard tracking
    address[] private players;
    mapping(address => bool) private isPlayerRegistered;
    
    // Leaderboard entry for queries
    struct LeaderboardEntry {
        address player;
        uint256 points;
        uint256 gamesWon;
        uint256 handsWon;
        uint256 rank;
    }
    
    // Events
    event StatsUpdated(
        address indexed player,
        uint256 points,
        uint256 gamesWon,
        uint256 handsWon,
        uint256 biggestPot
    );
    event PlayerRegistered(address indexed player);
    
    /**
     * @dev Constructor sets up roles
     * @param gameManager Address that will manage game operations
     */
    constructor(address gameManager) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GAME_MANAGER_ROLE, gameManager);
    }
    
    /**
     * @dev Update player statistics after a game
     * @param player Address of the player
     * @param points Total points (1 point per game won)
     * @param gamesWon Total games won by the player
     * @param handsWon Total hands won by the player
     * @param biggestPot Biggest pot won by the player
     */
    function updateStats(
        address player,
        uint256 points,
        uint256 gamesWon,
        uint256 handsWon,
        uint256 biggestPot
    ) 
        external 
        onlyRole(GAME_MANAGER_ROLE) 
        whenNotPaused 
        nonReentrant 
    {
        require(player != address(0), "Invalid player address");
        
        _registerPlayer(player);
        
        PlayerStats storage stats = playerStats[player];
        
        stats.points = points;
        stats.gamesWon = gamesWon;
        stats.handsWon = handsWon;
        stats.biggestPot = biggestPot;
        stats.lastUpdated = block.timestamp;
        
        emit StatsUpdated(
            player,
            stats.points,
            stats.gamesWon,
            stats.handsWon,
            stats.biggestPot
        );
    }
    
    /**
     * @dev Batch update statistics for multiple players
     * @param playerAddresses Array of player addresses
     * @param pointsArray Array of points for each player
     * @param gamesWonArray Array of games won for each player
     * @param handsWonArray Array of hands won for each player
     * @param biggestPotArray Array of biggest pots for each player
     */
    function batchUpdateStats(
        address[] calldata playerAddresses,
        uint256[] calldata pointsArray,
        uint256[] calldata gamesWonArray,
        uint256[] calldata handsWonArray,
        uint256[] calldata biggestPotArray
    ) 
        external 
        onlyRole(GAME_MANAGER_ROLE) 
        whenNotPaused 
        nonReentrant 
    {
        require(
            playerAddresses.length == pointsArray.length &&
            playerAddresses.length == gamesWonArray.length &&
            playerAddresses.length == handsWonArray.length &&
            playerAddresses.length == biggestPotArray.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < playerAddresses.length; i++) {
            address player = playerAddresses[i];
            require(player != address(0), "Invalid player address");
            
            _registerPlayer(player);
            
            PlayerStats storage stats = playerStats[player];
            
            stats.points = pointsArray[i];
            stats.gamesWon = gamesWonArray[i];
            stats.handsWon = handsWonArray[i];
            stats.biggestPot = biggestPotArray[i];
            stats.lastUpdated = block.timestamp;
            
            emit StatsUpdated(
                player,
                stats.points,
                stats.gamesWon,
                stats.handsWon,
                stats.biggestPot
            );
        }
    }
    
    /**
     * @dev Get statistics for a player
     * @param player Address of the player
     * @return Player statistics struct
     */
    function getPlayerStats(address player) 
        external 
        view 
        returns (PlayerStats memory) 
    {
        return playerStats[player];
    }
    
    /**
     * @dev Get top players ranked by points
     * @param count Number of top players to return
     * @return Array of leaderboard entries sorted by points
     */
    function getTopPlayers(uint256 count) 
        external 
        view 
        returns (LeaderboardEntry[] memory) 
    {
        require(count <= MAX_LEADERBOARD_SIZE, "Count exceeds maximum leaderboard size");
        
        uint256 playerCount = players.length;
        if (playerCount == 0) {
            return new LeaderboardEntry[](0);
        }
        
        uint256 resultCount = count > playerCount ? playerCount : count;
        address[] memory sortedPlayers = new address[](playerCount);
        
        for (uint256 i = 0; i < playerCount; i++) {
            sortedPlayers[i] = players[i];
        }
        
        // Sort by points
        for (uint256 i = 0; i < playerCount - 1; i++) {
            for (uint256 j = 0; j < playerCount - i - 1; j++) {
                if (playerStats[sortedPlayers[j]].points < 
                    playerStats[sortedPlayers[j + 1]].points) {
                    address temp = sortedPlayers[j];
                    sortedPlayers[j] = sortedPlayers[j + 1];
                    sortedPlayers[j + 1] = temp;
                }
            }
        }
        
        LeaderboardEntry[] memory topPlayers = new LeaderboardEntry[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            address playerAddr = sortedPlayers[i];
            PlayerStats memory stats = playerStats[playerAddr];
            topPlayers[i] = LeaderboardEntry({
                player: playerAddr,
                points: stats.points,
                gamesWon: stats.gamesWon,
                handsWon: stats.handsWon,
                rank: i + 1
            });
        }
        
        return topPlayers;
    }
    
    /**
     * @dev Get player ranking by points
     * @param player Address of the player
     * @return rank Player's rank (1-indexed), 0 if not found
     * @return totalPlayers Total number of players
     */
    function getPlayerRanking(address player) 
        external 
        view 
        returns (uint256 rank, uint256 totalPlayers) 
    {
        totalPlayers = players.length;
        
        if (!isPlayerRegistered[player]) {
            return (0, totalPlayers);
        }
        
        uint256 playerPoints = playerStats[player].points;
        rank = 1;
        
        for (uint256 i = 0; i < totalPlayers; i++) {
            if (players[i] != player && 
                playerStats[players[i]].points > playerPoints) {
                rank++;
            }
        }
        
        return (rank, totalPlayers);
    }
    
    /**
     * @dev Get total number of registered players
     * @return Number of players
     */
    function getTotalPlayers() external view returns (uint256) {
        return players.length;
    }
    
    /**
     * @dev Register a new player (internal)
     * @param player Address of the player
     */
    function _registerPlayer(address player) private {
        if (!isPlayerRegistered[player]) {
            players.push(player);
            isPlayerRegistered[player] = true;
            emit PlayerRegistered(player);
        }
    }
    
    /**
     * @dev Pause contract (emergency use)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Grant game manager role to an address
     * @param account Address to grant role to
     */
    function grantGameManagerRole(address account) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        grantRole(GAME_MANAGER_ROLE, account);
    }
    
    /**
     * @dev Revoke game manager role from an address
     * @param account Address to revoke role from
     */
    function revokeGameManagerRole(address account) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        revokeRole(GAME_MANAGER_ROLE, account);
    }
}
