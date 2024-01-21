import { Type } from "@sinclair/typebox";

export const BasePieceAuthSchema = Type.Object({
    displayName: Type.String(),
    description: Type.Optional(Type.String()),
})

export type BasePieceAuthSchema<AuthValueSchema> = {
    displayName: string;
    description?: string;
    validate?: (params: { auth: AuthValueSchema }) => Promise<{ valid: true } | { valid: false, error: string }>;
}
