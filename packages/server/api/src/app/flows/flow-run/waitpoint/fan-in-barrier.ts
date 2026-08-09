import { isNil } from '@activepieces/core-utils'
import { FanInException, FanInSummary, FlowRunStatus, isFlowRunStateTerminal } from '@activepieces/shared'
import { EntityManager } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { FlowRunEntity } from '../flow-run-entity'
import { Waitpoint } from './waitpoint-types'

const flowRunRepo = repoFactory(FlowRunEntity)

async function countChildren({ parentWaitpointId, projectId, entityManager }: ChildQueryParams): Promise<FanInChildCounts> {
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
        if (hasFailed(row.status)) {
            return { ...counts, failed: counts.failed + count, terminal: counts.terminal + count }
        }
        return { ...counts, stillRunning: counts.stillRunning + count }
    }, EMPTY_COUNTS)
}

async function hasNonTerminalChild({ parentWaitpointId, projectId }: ChildQueryParams): Promise<boolean> {
    return flowRunRepo()
        .createQueryBuilder('flowRun')
        .where('"flowRun"."parentWaitpointId" = :parentWaitpointId', { parentWaitpointId })
        .andWhere('"flowRun"."projectId" = :projectId', { projectId })
        .andWhere('"flowRun"."status" IN (:...statuses)', { statuses: NON_TERMINAL_STATUSES })
        .getExists()
}

async function listChildren({ parentWaitpointId, projectId, entityManager }: ChildQueryParams): Promise<FanInChild[]> {
    return flowRunRepo(entityManager)
        .createQueryBuilder('flowRun')
        .select(['"flowRun"."id" AS "id"', '"flowRun"."status" AS "status"', '"flowRun"."dispatchIndex" AS "dispatchIndex"'])
        .where('"flowRun"."parentWaitpointId" = :parentWaitpointId', { parentWaitpointId })
        .andWhere('"flowRun"."projectId" = :projectId', { projectId })
        .orderBy('"flowRun"."dispatchIndex"', 'ASC')
        .getRawMany<FanInChild>()
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

function toSummary({ counts, barrier, timedOut, children }: ToSummaryParams): FanInSummary {
    const expectedChildren = barrier.expectedChildren ?? 0
    const accountedFor = counts.succeeded + counts.failed + counts.canceled + counts.stillRunning
    const expected = expectedChildren + barrier.failedToDispatch
    const notStarted = Math.max(expectedChildren - accountedFor, 0)
    return {
        expected,
        succeeded: counts.succeeded,
        failed: counts.failed,
        canceled: counts.canceled,
        stillRunning: counts.stillRunning,
        notStarted,
        failedToDispatch: barrier.failedToDispatch,
        timedOut,
        exceptions: toExceptions({ children, expected, withoutARow: notStarted + barrier.failedToDispatch }),
    }
}

function toExceptions({ children, expected, withoutARow }: ToExceptionsParams): FanInException[] {
    const failed = children
        .filter((child) => hasFailed(child.status))
        .map((child) => ({ runId: child.id, dispatchIndex: child.dispatchIndex }))
    if (withoutARow === 0) {
        return failed
    }
    const dispatched = new Set(children.map((child) => child.dispatchIndex))
    const missing = Array.from({ length: expected }, (_, index) => index)
        .filter((index) => !dispatched.has(index))
        .slice(0, withoutARow)
        .map((dispatchIndex) => ({ runId: null, dispatchIndex }))
    return [...failed, ...missing]
}

function hasFailed(status: FlowRunStatus): boolean {
    return status !== FlowRunStatus.SUCCEEDED
        && status !== FlowRunStatus.CANCELED
        && isFlowRunStateTerminal({ status, ignoreInternalError: false })
}

const EMPTY_COUNTS: FanInChildCounts = {
    succeeded: 0,
    failed: 0,
    canceled: 0,
    stillRunning: 0,
    terminal: 0,
}

const NON_TERMINAL_STATUSES = Object.values(FlowRunStatus).filter((status) => !isFlowRunStateTerminal({ status, ignoreInternalError: false }))

export const fanInBarrier = { countChildren, listChildren, hasNonTerminalChild, isReleasable, toSummary }

export type FanInChild = {
    id: string
    status: FlowRunStatus
    dispatchIndex: number | null
}

export type FanInChildCounts = {
    succeeded: number
    failed: number
    canceled: number
    stillRunning: number
    terminal: number
}

export type FanInReleaseReason = 'predicate' | 'timeout' | 'seal'

type ChildQueryParams = {
    parentWaitpointId: string
    projectId: string
    entityManager?: EntityManager
}

type EvaluateBarrierParams = {
    counts: FanInChildCounts
    barrier: Waitpoint
}

type ToSummaryParams = {
    counts: FanInChildCounts
    barrier: Waitpoint
    timedOut: boolean
    children: FanInChild[]
}

type ToExceptionsParams = {
    children: FanInChild[]
    expected: number
    withoutARow: number
}
