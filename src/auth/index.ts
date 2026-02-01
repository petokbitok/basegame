export { BaseAccountAuth } from './BaseAccountAuth';
export type { UserIdentity, AuthResult } from './BaseAccountAuth';
export { VerificationService } from './VerificationService';
export type { VerificationResult } from './VerificationService';
// AuthServer requires express - only export if needed
// export { AuthServer } from './AuthServer';
export { SessionManager } from './SessionManager';
export type { Session } from './SessionManager';
