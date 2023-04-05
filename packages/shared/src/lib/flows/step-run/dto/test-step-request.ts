import { Type, Static } from "@sinclair/typebox";
import { SemVerType } from "../../../pieces";

export const TestStepRequestBody = Type.Object({
    actionName: Type.String(),
    pieceName: Type.String(),
    pieceVersion: SemVerType,
    input: Type.Record(
        Type.String(),
        Type.Any(),
    ),
    collectionId: Type.String(),
})

export type TestStepRequestBody = Static<typeof TestStepRequestBody>
