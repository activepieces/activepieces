import { isNil } from '@activepieces/core-utils'
import { FlowRunStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { SystemJobData, SystemJobName } from '../helper/system-jobs/common'
import { resumeService } from './resume-service'

export async function handleResumeDelayWaitpoint({ data, log }: HandleResumeDelayWaitpointParams): Promise<void> {
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
    log.info({ flowRun: { id: data.flowRunId }, waitpoint: { id: data.waitpointId } },
        '[RESUME_DELAY_WAITPOINT] Resuming flow')
    await resumeService(log).resumeFromWaitpoint({
        flowRunId: data.flowRunId,
        waitpointId: data.waitpointId,
        resumePayload: null,
    })
}

type HandleResumeDelayWaitpointParams = {
    data: SystemJobData<SystemJobName.RESUME_DELAY_WAITPOINT>
    log: FastifyBaseLogger
}
