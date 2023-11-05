import { Type, Static } from '@sinclair/typebox'
import { PackageType, PieceType, VersionType } from '../../pieces'
import { SampleDataSettingsObject } from '../sample-data'

export const AUTHENTICATION_PROPERTY_NAME = 'auth'

export enum TriggerType {
    EMPTY = 'EMPTY',
    WEBHOOK = 'WEBHOOK',
    PIECE = 'PIECE_TRIGGER',
}

const commonProps = {
    name: Type.String({}),
    valid: Type.Boolean({}),
    displayName: Type.String({}),
    nextAction: Type.Optional(Type.Any()),
}

export const EmptyTrigger = Type.Object({
    ...commonProps,
    type: Type.Literal(TriggerType.EMPTY),
    settings: Type.Any(),
})

export type EmptyTrigger = Static<typeof EmptyTrigger>

export const WebhookTrigger = Type.Object({
    ...commonProps,
    type: Type.Literal(TriggerType.WEBHOOK),
    settings: Type.Object({
        inputUiInfo: SampleDataSettingsObject,
    }),
})

export type WebhookTrigger = Static<typeof WebhookTrigger>

export const PieceTriggerSettings = Type.Object({
    pieceName: Type.String({}),
    pieceVersion: VersionType,
    pieceType: Type.Enum(PieceType),
    packageType: Type.Enum(PackageType),
    triggerName: Type.String({}),
    input: Type.Record(Type.String({}), Type.Any()),
    inputUiInfo: SampleDataSettingsObject,
})

export type PieceTriggerSettings = Static<typeof PieceTriggerSettings>

export const PieceTrigger = Type.Object({
    ...commonProps,
    type: Type.Literal(TriggerType.PIECE),
    settings: PieceTriggerSettings,
})

export type PieceTrigger = Static<typeof PieceTrigger>

export const Trigger = Type.Union([
    WebhookTrigger,
    PieceTrigger,
    EmptyTrigger,
])

export type Trigger = Static<typeof Trigger>
