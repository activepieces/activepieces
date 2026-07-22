import { apDayjs } from '@activepieces/server-utils'
import { FlowRunStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull, LessThan } from 'typeorm'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { flowRunRepo } from './flow-run-service'
import { runsMetadataQueue } from './flow-runs-queue'

export const stuckRunSweeper = (log: FastifyBaseLogger) => ({
    async sweep(): Promise<void> {
        const flowTimeoutSeconds = system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS)
        const staleBefore = apDayjs().subtract(flowTimeoutSeconds + STALE_GRACE_SECONDS, 'second').toISOString()
        const finishTime = apDayjs().toISOString()
        let sweptCount = 0
        let scannedCount = 0
        for (let page = 0; page < MAX_SWEEP_PAGES; page++) {
            const stuckRuns = await flowRunRepo().find({
                select: ['id', 'projectId'],
                where: {
                    status: FlowRunStatus.RUNNING,
                    archivedAt: IsNull(),
                    updated: LessThan(staleBefore),
                },
                order: {
                    updated: 'ASC',
                },
                skip: page * SWEEP_BATCH_SIZE,
                take: SWEEP_BATCH_SIZE,
            })
            scannedCount += stuckRuns.length
            for (const stuckRun of stuckRuns) {
                const swept = await runsMetadataQueue(log).addIfNoPendingWrite({
                    id: stuckRun.id,
                    projectId: stuckRun.projectId,
                    status: FlowRunStatus.TIMEOUT,
                    finishTime,
                })
                if (swept) {
                    sweptCount++
                }
            }
            if (stuckRuns.length < SWEEP_BATCH_SIZE) {
                break
            }
        }
        if (scannedCount === 0) {
            return
        }
        log.info({
            sweptCount,
            skippedPendingCount: scannedCount - sweptCount,
            staleBefore,
            pageCapReached: scannedCount === MAX_SWEEP_PAGES * SWEEP_BATCH_SIZE,
        }, '[stuckRunSweeper] Finalized stuck RUNNING flow runs')
    },
})

const STALE_GRACE_SECONDS = 600
const SWEEP_BATCH_SIZE = 250
const MAX_SWEEP_PAGES = 4
