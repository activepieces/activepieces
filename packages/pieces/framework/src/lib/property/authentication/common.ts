import * as z from "zod/mini";
import { ServerContext } from '../../context';

export const BasePieceAuthSchema = z.object({
  displayName: z.string(),
  description: z.optional(z.string()),
  hasConnectionIdentifier: z.optional(z.boolean()),
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
  // Derived by Piece.metadata(), not authored: functions cannot survive metadata
  // serialization, so the server has no other way to tell whether the hook above
  // exists before paying for an engine round-trip.
  hasConnectionIdentifier?: boolean;
};
