import { Static, Type } from "@sinclair/typebox";

export const PieceOptionRequest = Type.Object({
    stepName: Type.String({}),
    configName: Type.String({}),
    configs: Type.Object({})
});

export type PieceOptionRequest = Static<typeof PieceOptionRequest>;
