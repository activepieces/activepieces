import { PiecePropertyMap } from ".";
import { PieceAuthProperty } from "./authentication";
import { TSchema } from "@sinclair/typebox";
declare function buildSchema(props: PiecePropertyMap, auth: PieceAuthProperty | PieceAuthProperty[] | undefined, requireAuth?: boolean | undefined): import("@sinclair/typebox").TObject<Record<string, TSchema>>;
export declare const piecePropertiesUtils: {
    buildSchema: typeof buildSchema;
};
export {};
