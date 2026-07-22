import { isNil } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import { FlowRunStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull, LessThan } from 'typeorm'
import { distributedStore } from '../../database/redis-connections'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { redisMetadataKey, RunsMetadataUpsertData } from '../../workers/job'
import { flowRunRepo } from './flow-run-service'
import { runsMetadataQueue } from './flow-runs-queue'

export const stuckRunSweeper = (log: FastifyBaseLogger) => ({
    async sweep(): Promise<void> {
        const flowTimeoutSeconds = system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS)
        const staleBefore = apDayjs().subtract(flowTimeoutSeconds + STALE_GRACE_SECONDS, 'second').toISOString()
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
            take: SWEEP_BATCH_SIZE,
        })
        if (stuckRuns.length === 0) {
            return
        }
        const finishTime = apDayjs().toISOString()
        let sweptCount = 0
        for (const stuckRun of stuckRuns) {
            const pendingMetadata = await distributedStore.hgetJson<RunsMetadataUpsertData>(redisMetadataKey(stuckRun.id))
            if (!isNil(pendingMetadata) && Object.keys(pendingMetadata).length > 0) {
                continue
            }
            await runsMetadataQueue(log).add({
                id: stuckRun.id,
                projectId: stuckRun.projectId,
                status: FlowRunStatus.TIMEOUT,
                finishTime,
            })
            sweptCount++
        }
        log.info({
            sweptCount,
            skippedPendingCount: stuckRuns.length - sweptCount,
            staleBefore,
            batchCapReached: stuckRuns.length === SWEEP_BATCH_SIZE,
        }, '[stuckRunSweeper] Finalized stuck RUNNING flow runs')
    },
})

const STALE_GRACE_SECONDS = 600
const SWEEP_BATCH_SIZE = 250
