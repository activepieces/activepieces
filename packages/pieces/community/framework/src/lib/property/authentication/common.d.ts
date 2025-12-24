import { ServerContext } from '../../context';
export declare const BasePieceAuthSchema: import("@sinclair/typebox").TObject<{
    displayName: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type BasePieceAuthSchema<AuthValueSchema> = {
    displayName: string;
    description?: string;
    validate?: (params: {
        auth: AuthValueSchema;
        server: Omit<ServerContext, 'token'>;
    }) => Promise<{
        valid: true;
    } | {
        valid: false;
        error: string;
    }>;
};
