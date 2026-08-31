import { isNil } from '@activepieces/core-utils'
import { z } from 'zod'
import { RespondResponse } from '../execution/flow-execution'

export function shouldReleaseBarrier({ policy, sealed, counts }: ShouldReleaseBarrierParams): boolean {
    if (policy?.releaseOnFirstFailure === true && UNFAVOURABLE_SIGNAL_STATUSES.some((status) => countOf({ counts, status }) > 0)) {
        return true
    }
    if (!isNil(policy?.requiredSuccesses) && countOf({ counts, status: BarrierSignalStatus.SUCCEEDED }) >= policy.requiredSuccesses) {
        return true
    }
    if (!sealed) {
        return false
    }
    return countOf({ counts, status: BarrierSignalStatus.PENDING }) === 0
}

export function barrierReleasesOnLastPendingSignal({ policy, sealed }: BarrierReleaseShapeParams): boolean {
    return sealed && isNil(policy?.requiredSuccesses) && policy?.releaseOnFirstFailure !== true
}

function countOf({ counts, status }: { counts: BarrierSignalCounts, status: BarrierSignalStatus }): number {
    return counts[status] ?? 0
}

export const WaitpointVersion = z.enum(['V0', 'V1'])
export type WaitpointVersion = z.infer<typeof WaitpointVersion>

export enum BarrierSignalStatus {
    PENDING = 'PENDING',
    SUCCEEDED = 'SUCCEEDED',
    FAILED = 'FAILED',
    REJECTED = 'REJECTED',
    CANCELED = 'CANCELED',
    NOT_DISPATCHED = 'NOT_DISPATCHED',
}

export const BarrierPolicy = z.object({
    requiredSuccesses: z.number().int().positive().optional(),
    releaseOnFirstFailure: z.boolean().optional(),
    reasonRequiredOn: z.enum(['none', 'reject', 'both']).optional(),
})
export type BarrierPolicy = z.infer<typeof BarrierPolicy>

export const CreateBarrierRequest = z.object({
    policy: BarrierPolicy.optional(),
    signals: z.array(z.object({ label: z.string().optional() })).optional(),
})
export type CreateBarrierRequest = z.infer<typeof CreateBarrierRequest>

export const CreateWaitpointRequest = z.object({
    flowRunId: z.string(),
    projectId: z.string(),
    stepName: z.string(),
    type: z.enum(['DELAY', 'WEBHOOK', 'BARRIER']),
    version: WaitpointVersion,
    resumeDateTime: z.string().optional(),
    responseToSend: RespondResponse.optional(),
    workerHandlerId: z.string().optional(),
    httpRequestId: z.string().optional(),
    barrier: CreateBarrierRequest.optional(),
})
export type CreateWaitpointRequest = z.infer<typeof CreateWaitpointRequest>

export const BarrierCreatedState = z.object({
    signalCount: z.number().int().nonnegative(),
    signals: z.array(z.object({
        label: z.string().nullable(),
        confirmUrl: z.string(),
    })).optional(),
})
export type BarrierCreatedState = z.infer<typeof BarrierCreatedState>

export const CreateWaitpointResponse = z.object({
    id: z.string(),
    resumeUrl: z.string(),
    barrier: BarrierCreatedState.optional(),
})
export type CreateWaitpointResponse = z.infer<typeof CreateWaitpointResponse>

export const BarrierSignalSummary = z.object({
    sequence: z.number().int().nullable(),
    label: z.string().nullable(),
    outcome: z.enum(BarrierSignalStatus),
    result: z.unknown().nullable(),
    runId: z.string().nullable(),
})
export type BarrierSignalSummary = z.infer<typeof BarrierSignalSummary>

export const BarrierSummary = z.object({
    total: z.number().int().nonnegative(),
    succeeded: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    rejected: z.number().int().nonnegative(),
    canceled: z.number().int().nonnegative(),
    notDispatched: z.number().int().nonnegative(),
    stillRunning: z.number().int().nonnegative(),
    timedOut: z.boolean(),
    signals: z.array(BarrierSignalSummary).optional(),
    signalsTruncated: z.boolean().optional(),
})
export type BarrierSummary = z.infer<typeof BarrierSummary>

export const MAX_INLINE_BARRIER_SIGNALS = 100

export const MAX_SIGNAL_REASON_LENGTH = 2000

export const UNFAVOURABLE_SIGNAL_STATUSES = [
    BarrierSignalStatus.FAILED,
    BarrierSignalStatus.REJECTED,
    BarrierSignalStatus.CANCELED,
    BarrierSignalStatus.NOT_DISPATCHED,
]

export type BarrierSignalCounts = Partial<Record<BarrierSignalStatus, number>>

export type ShouldReleaseBarrierParams = {
    policy: BarrierPolicy | null | undefined
    sealed: boolean
    counts: BarrierSignalCounts
}

export type BarrierReleaseShapeParams = Pick<ShouldReleaseBarrierParams, 'policy' | 'sealed'>
