import { z } from 'zod'
import { BaseModelSchema, Nullable } from '../../core/common/base-model'
import { ApId } from '../../core/common/id-generator'
import { Metadata } from '../../core/common/metadata'
import { TriggerSource, WebhookHandshakeConfiguration } from '../trigger'
import { FlowVersion } from './flow-version'

export type FlowId = ApId
export enum FlowStatus {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
}

export enum FlowOperationStatus {
    NONE = 'NONE',
    DELETING = 'DELETING',
    /** @deprecated No longer set — status changes are now synchronous via distributed lock */
    ENABLING = 'ENABLING',
    /** @deprecated No longer set — status changes are now synchronous via distributed lock */
    DISABLING = 'DISABLING',
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
export const Flow = z.object({
    ...BaseModelSchema,
    projectId: z.string(),
    externalId: z.string(),
    ownerId: Nullable(z.string()),
    folderId: Nullable(z.string()),
    status: z.nativeEnum(FlowStatus),
    publishedVersionId: Nullable(z.string()),
    metadata: Nullable(Metadata),
    /** @deprecated Only DELETING is actively used — ENABLING/DISABLING are no longer set */
    operationStatus: z.nativeEnum(FlowOperationStatus),
    timeSavedPerRun: Nullable(z.number()),
    templateId: Nullable(z.string()),
})

export type Flow = z.infer<typeof Flow>
export const PopulatedFlow = Flow.extend({
    version: FlowVersion,
    triggerSource: TriggerSource.pick({ schedule: true }).optional(),
})

export type PopulatedFlow = z.infer<typeof PopulatedFlow>


export const PopulatedTriggerSource = TriggerSource.extend({
    flow: Flow,
})
export type PopulatedTriggerSource = z.infer<typeof PopulatedTriggerSource>
