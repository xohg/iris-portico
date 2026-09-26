/**
 * Public exports for the client.
 */
export { AdminClient, type ClientConfig } from './AdminClient';
export { AuthManager, type AuthState } from './auth';
export {
  ApiError,
  AuthError,
  BadRequestError,
  ConflictError,
  NotFoundError,
  PrivilegeError,
} from './errors';
export { buildUrl } from './http';
export type { Domains } from './domains';
