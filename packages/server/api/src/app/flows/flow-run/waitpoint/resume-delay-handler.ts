import { isNil } from '@activepieces/core-utils'
import { FlowRunStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { SystemJobData, SystemJobName } from '../../../helper/system-jobs/common'
import { flowRunService } from '../flow-run-service'
import { fanInBarrier } from './fan-in-barrier'
import { resumeService } from './resume-service'
import { waitpointService } from './waitpoint-service'

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

    const waitpoint = await waitpointService(log).findByIdAndFlowRunId({ waitpointId: data.waitpointId, flowRunId: data.flowRunId })
    if (isNil(waitpoint)) {
        log.info({ flowRun: { id: data.flowRunId }, waitpoint: { id: data.waitpointId } },
            '[RESUME_DELAY_WAITPOINT] Waitpoint no longer exists, dropping stale job')
        return
    }

    log.info({ flowRun: { id: data.flowRunId }, waitpoint: { id: data.waitpointId } },
        '[RESUME_DELAY_WAITPOINT] Resuming flow')

    if (!waitpoint.isFanIn) {
        await resumeService(log).resumeFromWaitpoint({
            flowRunId: data.flowRunId,
            waitpointId: data.waitpointId,
            resumePayload: null,
        })
        return
    }

    const counts = await fanInBarrier.countChildren({ parentWaitpointId: waitpoint.id, projectId: data.projectId })
    const result = await waitpointService(log).complete({
        flowRunId: data.flowRunId,
        projectId: data.projectId,
        waitpointId: waitpoint.id,
        resumePayload: { body: fanInBarrier.toSummary({ counts, barrier: waitpoint, timedOut: true }), headers: {}, queryParams: {} },
    })
    if (!result.completedExisting) {
        log.warn({ flowRun: { id: data.flowRunId }, waitpoint: { id: waitpoint.id } },
            '[RESUME_DELAY_WAITPOINT] Barrier was already completed without a resume reaching the queue, recovering it with the stored verdict')
    }
    await resumeService(log).resumeFromWaitpoint({
        flowRunId: data.flowRunId,
        waitpointId: waitpoint.id,
        resumePayload: result.waitpoint?.resumePayload ?? waitpoint.resumePayload,
    })
}

type HandleResumeDelayWaitpointParams = {
    data: SystemJobData<SystemJobName.RESUME_DELAY_WAITPOINT>
    log: FastifyBaseLogger
}
