import { isNil } from '@activepieces/core-utils'
import { FlowRunStatus, isFlowRunStateTerminal } from '@activepieces/shared'
import { EntityManager } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { FlowRunEntity } from '../flow-run-entity'
import { FanInBaseline, Waitpoint } from './waitpoint-types'

const flowRunRepo = repoFactory(FlowRunEntity)

async function countChildren({ parentRunId }: CountChildrenParams, entityManager?: EntityManager): Promise<FanInChildCounts> {
    const rows = await flowRunRepo(entityManager)
        .createQueryBuilder('flowRun')
        .select('"flowRun"."status"', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('"flowRun"."parentRunId" = :parentRunId', { parentRunId })
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

function isReleasable({ counts, barrier }: EvaluateBarrierParams): boolean {
    if (isNil(barrier.expectedChildren)) {
        return false
    }
    if (counts.stillRunning > 0) {
        return false
    }
    return counts.terminal - baselineTotal(barrier.fanInBaseline) >= barrier.expectedChildren
}

function toSummary({ counts, barrier, timedOut }: ToSummaryParams): FanInSummary {
    const baseline = barrier.fanInBaseline
    return {
        expected: (barrier.expectedChildren ?? 0) + barrier.failedToDispatch,
        succeeded: Math.max(counts.succeeded - (baseline?.succeeded ?? 0), 0),
        failed: Math.max(counts.failed - (baseline?.failed ?? 0), 0),
        canceled: Math.max(counts.canceled - (baseline?.canceled ?? 0), 0),
        stillRunning: counts.stillRunning,
        failedToDispatch: barrier.failedToDispatch,
        timedOut,
    }
}

function hasChildrenBeyondBaseline({ counts, barrier }: EvaluateBarrierParams): boolean {
    return counts.stillRunning > 0 || counts.terminal - baselineTotal(barrier.fanInBaseline) > 0
}

function toBaseline(counts: FanInChildCounts): FanInBaseline {
    return {
        succeeded: counts.succeeded,
        failed: counts.failed,
        canceled: counts.canceled,
    }
}

function baselineTotal(baseline: FanInBaseline | null): number {
    if (isNil(baseline)) {
        return 0
    }
    return baseline.succeeded + baseline.failed + baseline.canceled
}

const EMPTY_COUNTS: FanInChildCounts = {
    succeeded: 0,
    failed: 0,
    canceled: 0,
    stillRunning: 0,
    terminal: 0,
}

export const fanInBarrier = { countChildren, isReleasable, toSummary, toBaseline, hasChildrenBeyondBaseline }

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
    failedToDispatch: number
    timedOut: boolean
}

type CountChildrenParams = {
    parentRunId: string
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
