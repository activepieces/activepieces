import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "../../common";
import { FileData } from "../../file/file";

export const StepFile = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    flowId: Type.String(),
    projectId: Type.String(),
    stepName: Type.String(),
    size: Type.Number(),
    data: Type.Unknown(),
})

export type StepFile = Static<typeof StepFile>;

export const StepFileUpsert = Type.Object({
    name: Type.String(),
    flowId: Type.String(),
    stepName: Type.String(),
    file: Type.Array(FileData),
})

export type StepFileUpsert = Static<typeof StepFileUpsert>;

export const StepFileGet = Type.Object({
    id: Type.String(),
    projectId: Type.String(),
})

export type StepFileGet = Static<typeof StepFileGet>;
