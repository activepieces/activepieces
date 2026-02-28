import { Static, Type } from '@sinclair/typebox'
import { DiscriminatedUnion } from '../../../core/common/base-model'
import { VersionType } from '../../pieces'
import { CodeActionSettings, LoopOnItemsActionSettings, PieceActionSettings, RouterActionSettings } from '../actions/action'
import { PropertySettings } from '../properties'
import { SampleDataSetting } from '../sample-data'

export const AUTHENTICATION_PROPERTY_NAME = 'auth'


export const PieceTriggerSettings = Type.Object({
    sampleData: Type.Optional(SampleDataSetting),
    propertySettings: Type.Record(Type.String(), PropertySettings),
    customLogoUrl: Type.Optional(Type.String()),
    pieceName: Type.String({}),
    pieceVersion: VersionType,
    triggerName: Type.Optional(Type.String({})),
    input: Type.Record(Type.String({}), Type.Any()),
})

export type PieceTriggerSettings = Static<typeof PieceTriggerSettings>


export enum FlowTriggerKind {
    EMPTY = 'EMPTY',
    PIECE = 'PIECE_TRIGGER',
}

const commonProps = {
    name: Type.String({}),
    valid: Type.Boolean({}),
    displayName: Type.String({}),
}


export const EmptyTrigger = Type.Object({
    ...commonProps,
    kind: Type.Literal(FlowTriggerKind.EMPTY),
    settings: Type.Any(),
})

export type EmptyTrigger = Static<typeof EmptyTrigger>


export const PieceTrigger = Type.Object({
    ...commonProps,
    kind: Type.Literal(FlowTriggerKind.PIECE),
    settings: PieceTriggerSettings,
})

export type PieceTrigger = Static<typeof PieceTrigger>

export const FlowTrigger = DiscriminatedUnion('kind', [
    PieceTrigger,
    EmptyTrigger,
])

export type FlowTrigger = Static<typeof FlowTrigger>

const updateCommonProps = {
    name: Type.String({}),
    valid: Type.Boolean({}),
    displayName: Type.String({}),
}

export const UpdateEmptyTrigger = Type.Object({
    ...updateCommonProps,
    kind: Type.Literal(FlowTriggerKind.EMPTY),
    settings: Type.Any(),
})

export const UpdatePieceTrigger = Type.Object({
    ...updateCommonProps,
    kind: Type.Literal(FlowTriggerKind.PIECE),
    settings: PieceTriggerSettings,
})

export type StepSettings =
  | CodeActionSettings
  | PieceActionSettings
  | PieceTriggerSettings
  | RouterActionSettings
  | LoopOnItemsActionSettings
