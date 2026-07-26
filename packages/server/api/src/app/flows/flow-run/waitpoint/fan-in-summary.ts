import { FlowRunStatus, isFlowRunStateTerminal } from '@activepieces/shared'
import { In } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { FlowRunEntity } from '../flow-run-entity'

const flowRunRepo = repoFactory(FlowRunEntity)

const NON_TERMINAL_STATUSES = [FlowRunStatus.QUEUED, FlowRunStatus.RUNNING, FlowRunStatus.PAUSED]

async function buildSummary({ parentRunId, expectedChildren, timedOut }: BuildSummaryParams): Promise<FanInSummary> {
    const rows = await flowRunRepo()
        .createQueryBuilder('flowRun')
        .select('"flowRun"."status"', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('"flowRun"."parentRunId" = :parentRunId', { parentRunId })
        .groupBy('"flowRun"."status"')
        .getRawMany<{ status: FlowRunStatus, count: string }>()

    const summary: FanInSummary = {
        expected: expectedChildren,
        succeeded: 0,
        failed: 0,
        canceled: 0,
        stillRunning: 0,
        timedOut,
    }
    for (const row of rows) {
        const count = Number(row.count)
        if (row.status === FlowRunStatus.SUCCEEDED) {
            summary.succeeded += count
        }
        else if (row.status === FlowRunStatus.CANCELED) {
            summary.canceled += count
        }
        else if (isFlowRunStateTerminal({ status: row.status, ignoreInternalError: false })) {
            summary.failed += count
        }
        else {
            summary.stillRunning += count
        }
    }
    return summary
}

async function countNonTerminalChildren({ parentRunId }: { parentRunId: string }): Promise<number> {
    return flowRunRepo().countBy({
        parentRunId,
        status: In(NON_TERMINAL_STATUSES),
    })
}

export const fanInBarrier = { buildSummary, countNonTerminalChildren }

export type FanInSummary = {
    expected: number
    succeeded: number
    failed: number
    canceled: number
    stillRunning: number
    timedOut: boolean
}

type BuildSummaryParams = {
    parentRunId: string
    expectedChildren: number
    timedOut: boolean
}
