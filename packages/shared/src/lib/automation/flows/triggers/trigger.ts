import { z } from 'zod'
import { VersionType } from '../../pieces'
import { CodeActionSettings, LoopOnItemsActionSettings, PieceActionSettings, RouterActionSettings } from '../actions/action'
import { PropertySettings } from '../properties'
import { SampleDataSetting } from '../sample-data'

export const AUTHENTICATION_PROPERTY_NAME = 'auth'


export const PieceTriggerSettings = z.object({
    sampleData: SampleDataSetting.optional(),
    propertySettings: z.record(z.string(), PropertySettings),
    customLogoUrl: z.string().optional(),
    pieceName: z.string(),
    pieceVersion: VersionType,
    triggerName: z.string().optional(),
    input: z.record(z.string(), z.any()),
})

export type PieceTriggerSettings = z.infer<typeof PieceTriggerSettings>


export enum FlowTriggerType {
    EMPTY = 'EMPTY',
    PIECE = 'PIECE_TRIGGER',
}

const commonProps = {
    name: z.string(),
    valid: z.boolean(),
    displayName: z.string(),
    nextAction: z.any().optional(),
}


export const EmptyTrigger = z.object({
    ...commonProps,
    type: z.literal(FlowTriggerType.EMPTY),
    settings: z.any(),
})

export type EmptyTrigger = z.infer<typeof EmptyTrigger>


export const PieceTrigger = z.object({
    ...commonProps,
    type: z.literal(FlowTriggerType.PIECE),
    settings: PieceTriggerSettings,
})

export type PieceTrigger = z.infer<typeof PieceTrigger>

export const FlowTrigger = z.union([
    PieceTrigger,
    EmptyTrigger,
])

export type FlowTrigger = z.infer<typeof FlowTrigger>


export type StepSettings =
  | CodeActionSettings
  | PieceActionSettings
  | PieceTriggerSettings
  | RouterActionSettings
  | LoopOnItemsActionSettings
