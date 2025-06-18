import { Static, Type } from "@sinclair/typebox";
import { DiscriminatedUnion } from "@activepieces/shared";
import { SampleDataSetting } from "@activepieces/shared";
import { ActionErrorHandlingOptions } from "@activepieces/shared";
import { PackageType, PieceType, VersionType } from "@activepieces/shared";


export enum StepType {
    CODE = 'CODE',
    PIECE = 'PIECE',
    PIECE_TRIGGER = 'PIECE_TRIGGER',
    EMPTY = 'EMPTY',
    ROUTER = 'ROUTER',
    LOOP = 'LOOP',
}

const CommonStep = {
    flowId: Type.String(),
    displayName: Type.String(),
    flowVersionId: Type.String(),
    name: Type.String(),
}

export const SourceCode = Type.Object({
    packageJson: Type.String({}),
    code: Type.String({}),
})

export type SourceCode = Static<typeof SourceCode>

export const CodeActionSettings = Type.Object({
    sourceCode: SourceCode,
    input: Type.Record(Type.String({}), Type.Any()),
    inputUiInfo: Type.Optional(SampleDataSetting),
    errorHandlingOptions: ActionErrorHandlingOptions,
})

export type CodeActionSettings = Static<typeof CodeActionSettings>

const CodeStep = {
    ...CommonStep,
    type: Type.Literal(StepType.CODE),
    settings: CodeActionSettings,
}


export const PieceActionSettings = Type.Object({
    packageType: Type.Enum(PackageType),
    pieceType: Type.Enum(PieceType),
    pieceName: Type.String({}),
    pieceVersion: VersionType,
    actionName: Type.Optional(Type.String({})),
    input: Type.Record(Type.String({}), Type.Unknown()),
    inputUiInfo: SampleDataSetting,
    errorHandlingOptions: ActionErrorHandlingOptions,
})
export type PieceActionSettings = Static<typeof PieceActionSettings>

const PieceStep = {
    ...CommonStep,
    type: Type.Literal(StepType.PIECE),
    settings: PieceActionSettings,
}


export const LoopOnItemsActionSettings = Type.Object({
    items: Type.String(),
    inputUiInfo: SampleDataSetting,
})
export type LoopOnItemsActionSettings = Static<
    typeof LoopOnItemsActionSettings
>

export const LoopOnItemsStep = {
    ...CommonStep,
    type: Type.Literal(StepType.LOOP),
    settings: LoopOnItemsActionSettings,
}

export const Step = Type.Recursive(Self => DiscriminatedUnion('type', [
    Type.Object({
        nextStep: Self,
        ...CodeStep,
    }),
    Type.Object({
        nextStep: Self,
        ...PieceStep,
    }),
    Type.Object({
        children: Type.Array(Self),
        nextStep: Self,
        ...LoopOnItemsStep,
    }),
]))

export type Step = Static<typeof Step>
