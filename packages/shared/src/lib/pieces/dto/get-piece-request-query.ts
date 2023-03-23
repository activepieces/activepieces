import { Static, Type } from "@sinclair/typebox";
import { semVerRegex } from "../../common/utils/semVer";

export const SemVerType = Type.RegEx(semVerRegex);

export const GetPieceRequestQuery = Type.Object({
    version: SemVerType,
});

export type GetPieceRequestQuery = Static<typeof GetPieceRequestQuery>;
