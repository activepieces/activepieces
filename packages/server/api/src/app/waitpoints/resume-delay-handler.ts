import { isNil } from '@activepieces/core-utils'
import { wideEvent } from '@activepieces/server-utils'
import { FlowRunStatus, PauseType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { SystemJobData, SystemJobName } from '../helper/system-jobs/common'
import { barrierService } from './barrier-service'
import { resumeService } from './resume-service'
import { waitpointService } from './waitpoint-service'

export async function handleResumeDelayWaitpoint({ data, log }: HandleResumeDelayWaitpointParams): Promise<void> {
    wideEvent.set({
        project: { id: data.projectId },
        flowRun: { id: data.flowRunId },
        waitpoint: { id: data.waitpointId },
    })
    const flowRun = await flowRunService(log).getOne({ id: data.flowRunId, projectId: data.projectId })
    if (isNil(flowRun)) {
        log.info({ flowRun: { id: data.flowRunId }, waitpoint: { id: data.waitpointId } },
            '[RESUME_DELAY_WAITPOINT] Flow run no longer exists (expired/deleted), skipping')
        return
    }
    if (flowRun.status !== FlowRunStatus.PAUSED) {
        log.info({ flowRun: { id: data.flowRunId }, waitpoint: { id: data.waitpointId }, status: flowRun.status },
            '[RESUME_DELAY_WAITPOINT] Flow not PAUSED, skipping')
        return
    }

    const waitpoint = await waitpointService(log).findByIdAndFlowRunId({ waitpointId: data.waitpointId, flowRunId: data.flowRunId })
    if (isNil(waitpoint)) {
        log.info({ flowRun: { id: data.flowRunId }, waitpoint: { id: data.waitpointId } },
            '[RESUME_DELAY_WAITPOINT] Waitpoint no longer exists, dropping stale job')
        return
    }

    log.info({ flowRun: { id: data.flowRunId }, waitpoint: { id: data.waitpointId } },
        '[RESUME_DELAY_WAITPOINT] Resuming flow')

    if (waitpoint.type !== PauseType.BARRIER) {
        await resumeService(log).resumeFromWaitpoint({
            flowRunId: data.flowRunId,
            waitpointId: data.waitpointId,
            resumePayload: null,
        })
        return
    }

    await barrierService(log).release({ barrier: waitpoint, timedOut: true, releaseReason: 'timeout' })
}

type HandleResumeDelayWaitpointParams = {
    data: SystemJobData<SystemJobName.RESUME_DELAY_WAITPOINT>
    log: FastifyBaseLogger
}
