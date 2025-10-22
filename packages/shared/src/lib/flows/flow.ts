import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { Metadata } from '../common/metadata'
import { TriggerSource, WebhookHandshakeConfiguration } from '../trigger'
import { FlowVersion } from './flow-version'

export type FlowId = ApId
export enum FlowStatus {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
}

export const flowExecutionStateKey = (flowId: FlowId) => `flow-execution-state:${flowId}`

export type FlowExecutionState = {
    exists: false
} | {
    exists: true
    handshakeConfiguration: WebhookHandshakeConfiguration | undefined
    flow: Flow
    platformId: string
}
export const Flow = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    externalId: Type.String(),
    folderId: Nullable(Type.String()),
    status: Type.Enum(FlowStatus),
    publishedVersionId: Nullable(Type.String()),
    metadata: Nullable(Metadata),
})

export type Flow = Static<typeof Flow>
export const PopulatedFlow = Type.Composite([
    Flow,
    Type.Object({
        version: FlowVersion,
        triggerSource: Type.Optional(Type.Pick(TriggerSource, ['schedule'])),
    }),
])

export type PopulatedFlow = Static<typeof PopulatedFlow>


export const PopulatedTriggerSource = Type.Composite([
    TriggerSource,
    Type.Object({
        flow: Flow,
    }),
])
export type PopulatedTriggerSource = Static<typeof PopulatedTriggerSource>