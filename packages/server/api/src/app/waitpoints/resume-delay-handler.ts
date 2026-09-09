import { isNil } from '@activepieces/core-utils'
import { wideEvent } from '@activepieces/server-utils'
import { FlowRunStatus, flowStructureUtil, PauseType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { runsMetadataQueue } from '../flows/flow-run/flow-runs-queue'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { SystemJobData, SystemJobName } from '../helper/system-jobs/common'
import { barrierService } from './barrier-service'
import { resumeService } from './resume-service'
import { waitpointService } from './waitpoint-service'
import { WaitpointStatus } from './waitpoint-types'

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
    if (isNil(waitpoint) || waitpoint.status !== WaitpointStatus.PENDING) {
        log.info({ flowRun: { id: data.flowRunId }, waitpoint: { id: data.waitpointId }, waitpointStatus: waitpoint?.status },
            '[RESUME_DELAY_WAITPOINT] Waitpoint no longer PENDING (stale timer from completed/deleted waitpoint), skipping')
        return
    }
    if (waitpoint.type === PauseType.BARRIER) {
        log.info({ flowRun: { id: data.flowRunId }, waitpoint: { id: data.waitpointId } },
            '[RESUME_DELAY_WAITPOINT] Barrier reached its deadline, releasing it with a timed-out summary')
        await barrierService(log).release({ barrier: waitpoint, timedOut: true, releaseReason: 'timeout' })
        return
    }

    const pauseTimeoutDays = system.getNumberOrThrow(AppSystemProp.PAUSED_FLOW_TIMEOUT_DAYS)
    const pastPauseTimeout = dayjs().isAfter(dayjs(flowRun.created).add(pauseTimeoutDays, 'day'))
    const isWebhookExpiry = waitpoint.type === PauseType.WEBHOOK
    if (isWebhookExpiry || pastPauseTimeout) {
        const message = isWebhookExpiry
            ? 'Waitpoint expired: no webhook was received within the pause-timeout window'
            : `Resume dispatched past pause-timeout window (${pauseTimeoutDays} days from run start)`
        log.warn({ flowRun: { id: data.flowRunId }, waitpoint: { id: data.waitpointId }, pauseTimeoutDays, isWebhookExpiry, pastPauseTimeout },
            '[RESUME_DELAY_WAITPOINT] Marking run FAILED instead of resuming')
        const displayName = await resolveStepDisplayName({ flowVersionId: flowRun.flowVersionId, stepName: waitpoint.stepName, log })
        await runsMetadataQueue(log).add({
            id: flowRun.id,
            projectId: flowRun.projectId,
            status: FlowRunStatus.FAILED,
            finishTime: dayjs().toISOString(),
            failedStep: { name: waitpoint.stepName, displayName, message },
            failParentOnFailure: flowRun.failParentOnFailure,
        })
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

async function resolveStepDisplayName({ flowVersionId, stepName, log }: ResolveStepDisplayNameParams): Promise<string> {
    const flowVersion = await flowVersionService(log).getOne(flowVersionId)
    if (isNil(flowVersion)) {
        return stepName
    }
    const step = flowStructureUtil.getStep(stepName, flowVersion.trigger)
    return step?.displayName ?? stepName
}

type HandleResumeDelayWaitpointParams = {
    data: SystemJobData<SystemJobName.RESUME_DELAY_WAITPOINT>
    log: FastifyBaseLogger
}

type ResolveStepDisplayNameParams = {
    flowVersionId: string
    stepName: string
    log: FastifyBaseLogger
}
