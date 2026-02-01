// @ts-nocheck
// This file is not currently used in the project and requires express dependency
import express, { Request, Response } from 'express';
import { VerificationService } from './VerificationService';

/**
 * Express server for Base Account authentication
 * Provides endpoints for nonce generation and signature verification
 */
export class AuthServer {
  private app: express.Application;
  private verificationService: VerificationService;
  private port: number;

  constructor(port: number = 3001) {
    this.app = express();
    this.verificationService = new VerificationService();
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Set up Express middleware
   */
  private setupMiddleware(): void {
    this.app.use(express.json());
    
    // CORS middleware for development
    // TODO: In production, restrict to specific origins
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
    });
  }

  /**
   * Set up authentication routes
   */
  private setupRoutes(): void {
    // Generate nonce endpoint
    this.app.get('/auth/nonce', (req: Request, res: Response) => {
      const nonce = this.verificationService.generateNonce();
      res.json({ nonce });
    });

    // Verify signature endpoint
    this.app.post('/auth/verify', async (req: Request, res: Response) => {
      const { address, message, signature } = req.body;

      // Validate request body
      if (!address || !message || !signature) {
        return res.status(400).json({
          error: 'Missing required fields: address, message, signature',
        });
      }

      // Verify signature
      const result = await this.verificationService.verifySignature(
        address,
        message,
        signature
      );

      if (!result.valid) {
        return res.status(401).json({
          error: result.error || 'Invalid signature',
        });
      }

      // In production, create a JWT token here and return it
      // For now, just return success with address
      res.json({
        ok: true,
        address: result.address,
      });
    });

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok' });
    });
  }

  /**
   * Start the authentication server
   */
  start(): void {
    this.app.listen(this.port, () => {
      console.log(`Auth server listening on port ${this.port}`);
    });
  }

  /**
   * Get the Express app instance
   */
  getApp(): express.Application {
    return this.app;
  }

  /**
   * Get the verification service instance
   */
  getVerificationService(): VerificationService {
    return this.verificationService;
  }
}
