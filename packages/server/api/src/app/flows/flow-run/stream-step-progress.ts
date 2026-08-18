import { isManualPieceTrigger, isNil } from '@activepieces/core-utils'
import { FlowRun, FlowTriggerType, FlowVersion, RunEnvironment, StreamStepProgress } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowVersionService } from '../flow-version/flow-version.service'

function hasManualTrigger({ flowVersion }: HasManualTriggerParams): boolean {
    const trigger = flowVersion?.trigger
    if (isNil(trigger) || trigger.type !== FlowTriggerType.PIECE || isNil(trigger.settings.triggerName)) {
        return false
    }
    return isManualPieceTrigger({ pieceName: trigger.settings.pieceName, triggerName: trigger.settings.triggerName })
}

function isStreamedToBuilder({ flowRun, flowVersion }: IsStreamedToBuilderParams): boolean {
    if (flowRun.environment === RunEnvironment.TESTING) {
        return true
    }
    return hasManualTrigger({ flowVersion })
}

function forRun({ flowRun, flowVersion }: IsStreamedToBuilderParams): StreamStepProgress {
    return isStreamedToBuilder({ flowRun, flowVersion })
        ? StreamStepProgress.WEBSOCKET
        : StreamStepProgress.NONE
}

async function forResume({ flowRun, log }: ForResumeParams): Promise<StreamStepProgress> {
    if (flowRun.environment === RunEnvironment.TESTING) {
        return StreamStepProgress.WEBSOCKET
    }
    const flowVersion = await flowVersionService(log).getOne(flowRun.flowVersionId)
    return forRun({ flowRun, flowVersion })
}

export const streamStepProgressUtils = {
    hasManualTrigger,
    isStreamedToBuilder,
    forRun,
    forResume,
}

type HasManualTriggerParams = {
    flowVersion: FlowVersion | null
}

type IsStreamedToBuilderParams = {
    flowRun: FlowRun
    flowVersion: FlowVersion | null
}

type ForResumeParams = {
    flowRun: FlowRun
    log: FastifyBaseLogger
}
