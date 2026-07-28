import { isNil } from '@activepieces/core-utils'
import { FlowRunStatus, isFlowRunStateTerminal } from '@activepieces/shared'
import { EntityManager } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { FlowRunEntity } from '../flow-run-entity'
import { Waitpoint } from './waitpoint-types'

const flowRunRepo = repoFactory(FlowRunEntity)

async function countChildren({ parentWaitpointId, projectId }: CountChildrenParams, entityManager?: EntityManager): Promise<FanInChildCounts> {
    const rows = await flowRunRepo(entityManager)
        .createQueryBuilder('flowRun')
        .select('"flowRun"."status"', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('"flowRun"."parentWaitpointId" = :parentWaitpointId', { parentWaitpointId })
        .andWhere('"flowRun"."projectId" = :projectId', { projectId })
        .groupBy('"flowRun"."status"')
        .getRawMany<{ status: FlowRunStatus, count: string }>()

    return rows.reduce<FanInChildCounts>((counts, row) => {
        const count = Number(row.count)
        if (row.status === FlowRunStatus.SUCCEEDED) {
            return { ...counts, succeeded: counts.succeeded + count, terminal: counts.terminal + count }
        }
        if (row.status === FlowRunStatus.CANCELED) {
            return { ...counts, canceled: counts.canceled + count, terminal: counts.terminal + count }
        }
        if (isFlowRunStateTerminal({ status: row.status, ignoreInternalError: false })) {
            return { ...counts, failed: counts.failed + count, terminal: counts.terminal + count }
        }
        return { ...counts, stillRunning: counts.stillRunning + count }
    }, EMPTY_COUNTS)
}

async function hasNonTerminalChild({ parentWaitpointId, projectId }: CountChildrenParams): Promise<boolean> {
    return flowRunRepo()
        .createQueryBuilder('flowRun')
        .where('"flowRun"."parentWaitpointId" = :parentWaitpointId', { parentWaitpointId })
        .andWhere('"flowRun"."projectId" = :projectId', { projectId })
        .andWhere('"flowRun"."status" IN (:...statuses)', { statuses: NON_TERMINAL_STATUSES })
        .getExists()
}

function isReleasable({ counts, barrier }: EvaluateBarrierParams): boolean {
    if (isNil(barrier.expectedChildren)) {
        return false
    }
    if (counts.stillRunning > 0) {
        return false
    }
    return counts.terminal >= barrier.expectedChildren
}

function toSummary({ counts, barrier, timedOut }: ToSummaryParams): FanInSummary {
    const expectedChildren = barrier.expectedChildren ?? 0
    const accountedFor = counts.succeeded + counts.failed + counts.canceled + counts.stillRunning
    return {
        expected: expectedChildren + barrier.failedToDispatch,
        succeeded: counts.succeeded,
        failed: counts.failed,
        canceled: counts.canceled,
        stillRunning: counts.stillRunning,
        notStarted: Math.max(expectedChildren - accountedFor, 0),
        failedToDispatch: barrier.failedToDispatch,
        timedOut,
    }
}

function hasAnyChildren(counts: FanInChildCounts): boolean {
    return counts.stillRunning > 0 || counts.terminal > 0
}

const EMPTY_COUNTS: FanInChildCounts = {
    succeeded: 0,
    failed: 0,
    canceled: 0,
    stillRunning: 0,
    terminal: 0,
}

const NON_TERMINAL_STATUSES = Object.values(FlowRunStatus).filter((status) => !isFlowRunStateTerminal({ status, ignoreInternalError: false }))

export const fanInBarrier = { countChildren, hasNonTerminalChild, isReleasable, toSummary, hasAnyChildren }

export type FanInChildCounts = {
    succeeded: number
    failed: number
    canceled: number
    stillRunning: number
    terminal: number
}

export type FanInSummary = {
    expected: number
    succeeded: number
    failed: number
    canceled: number
    stillRunning: number
    notStarted: number
    failedToDispatch: number
    timedOut: boolean
}

type CountChildrenParams = {
    parentWaitpointId: string
    projectId: string
}

type EvaluateBarrierParams = {
    counts: FanInChildCounts
    barrier: Waitpoint
}

type ToSummaryParams = {
    counts: FanInChildCounts
    barrier: Waitpoint
    timedOut: boolean
}
