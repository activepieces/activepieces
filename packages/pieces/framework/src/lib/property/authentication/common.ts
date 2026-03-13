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
};
