import { Type } from "@sinclair/typebox";
import { AuthValidationContext } from "../../context";

export const BasePieceAuthSchema = Type.Object({
    displayName: Type.String(),
    description: Type.Optional(Type.String()),
})

export type BasePieceAuthSchema<AuthValueSchema> = {
    displayName: string;
    description?: string;
    validate?: (params: { auth: AuthValueSchema; ctx: AuthValidationContext}) => Promise<{ valid: true } | { valid: false, error: string }>;
}
