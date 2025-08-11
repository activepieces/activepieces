import { Type } from '@sinclair/typebox';
import { ServerContext } from '../../context';

export const BasePieceAuthSchema = Type.Object({
  displayName: Type.String(),
  description: Type.Optional(Type.String())
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
