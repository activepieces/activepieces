import * as z from "zod/mini";
import { ServerContext } from '../../context';

export const BasePieceAuthSchema = z.object({
  displayName: z.string(),
  description: z.optional(z.string())
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
