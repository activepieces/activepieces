import { Static, Type } from '@sinclair/typebox'
import { VersionType } from '../../pieces'
import { PropertySettings } from '../properties'
import { SampleDataSetting } from '../sample-data'

export const AUTHENTICATION_PROPERTY_NAME = 'auth'

export enum FlowTriggerType {
    EMPTY = 'EMPTY',
    PIECE = 'PIECE_TRIGGER',
}

const commonProps = {
    name: Type.String({}),
    valid: Type.Boolean({}),
    displayName: Type.String({}),
    nextAction: Type.Optional(Type.Any()),
}

const commonTriggerSettings = {
    sampleData: Type.Optional(SampleDataSetting),
    propertySettings: Type.Record(Type.String(), PropertySettings),
    customLogoUrl: Type.Optional(Type.String()),
}

export const EmptyTrigger = Type.Object({
    ...commonProps,
    type: Type.Literal(FlowTriggerType.EMPTY),
    settings: Type.Any(),
})

export type EmptyTrigger = Static<typeof EmptyTrigger>

export const PieceTriggerSettings = Type.Object({
    ...commonTriggerSettings,
    pieceName: Type.String({}),
    pieceVersion: VersionType,
    triggerName: Type.Optional(Type.String({})),
    input: Type.Record(Type.String({}), Type.Any()),
})

export type PieceTriggerSettings = Static<typeof PieceTriggerSettings>

export const PieceTrigger = Type.Object({
    ...commonProps,
    type: Type.Literal(FlowTriggerType.PIECE),
    settings: PieceTriggerSettings,
})

export type PieceTrigger = Static<typeof PieceTrigger>

export const FlowTrigger = Type.Union([
    PieceTrigger,
    EmptyTrigger,
])

export type FlowTrigger = Static<typeof FlowTrigger>
