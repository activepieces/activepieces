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
  // Resolves a human-readable label for a connection made with this auth
  // (e.g. the account email, or Slack's "display-name (workspace)"), shown in
  // the UI so users can tell which account a connection belongs to. Best-effort.
  getConnectionIdentifier?: (params: { auth: AuthValueSchema; server: Omit<ServerContext, 'token'> }) => Promise<string | undefined>;
};
