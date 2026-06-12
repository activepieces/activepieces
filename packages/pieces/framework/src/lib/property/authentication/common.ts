import { z } from 'zod';
import { ServerContext } from '../../context';

export const BasePieceAuthSchema = z.object({
  displayName: z.string(),
  description: z.string().optional()
});

export type BasePieceAuthSchema<AuthValueSchema> = {
  displayName: string;
  description?: string;
  validate?: (params: { auth: AuthValueSchema; server: Omit<ServerContext, 'token'> }) => Promise<
    | { valid: true }
    | {
    valid: false;
    error: string;
  }
  >;
  /**
   * Optional refresh callback for CUSTOM_AUTH connections.
   *
   * Called automatically by the platform when nextRefreshEpochMs is within 15 minutes of now.
   * Also called once immediately after a connection is first created (after validate succeeds)
   * to establish the initial nextRefreshEpochMs.
   *
   * @returns value - New props to store (replaces current props in the connection)
   * @returns nextRefreshEpochMs - When to call refresh again (epoch ms). Omit to disable further auto-refresh.
   *
   * @example Token with known expiry
   * refresh: async ({ auth }) => {
   *   const { accessToken, expiresIn } = await myApi.refresh(auth.refreshToken)
   *   return { value: { ...auth, accessToken }, nextRefreshEpochMs: Date.now() + expiresIn * 1000 }
   * }
   *
   * @example Fixed interval (when API doesn't return expiry)
   * refresh: async ({ auth }) => {
   *   const newKey = await myApi.rotateKey(auth.apiKey)
   *   return { value: { ...auth, apiKey: newKey }, nextRefreshEpochMs: Date.now() + 3600 * 1000 }
   * }
   */
  refresh?: (params: { auth: AuthValueSchema; server: Omit<ServerContext, 'token'> }) => Promise<{
    value: AuthValueSchema;
    nextRefreshEpochMs?: number;
  }>;
};
