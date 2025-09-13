import { Static, Type } from '@sinclair/typebox'
import { FlowAction, PieceActionOrTriggerSettings } from '../actions/action'

export const AUTHENTICATION_PROPERTY_NAME = 'auth'

export enum FlowTriggerType {
    EMPTY = 'EMPTY',
    PIECE = 'PIECE_TRIGGER',
}

const commonProps = {
    name: Type.String({}),
    valid: Type.Boolean({}),
    displayName: Type.String({}),
    nextAction: Type.Optional(FlowAction),
}


export const EmptyTrigger = Type.Object({
    ...commonProps,
    type: Type.Literal(FlowTriggerType.EMPTY),
    settings: Type.Any(),
})

export type EmptyTrigger = Static<typeof EmptyTrigger>


export const PieceTrigger = Type.Object({
    ...commonProps,
    type: Type.Literal(FlowTriggerType.PIECE),
    settings: PieceActionOrTriggerSettings,
})

export type PieceTrigger = Static<typeof PieceTrigger>

export const FlowTrigger = Type.Union([
    PieceTrigger,
    EmptyTrigger,
])

export type FlowTrigger = Static<typeof FlowTrigger>
