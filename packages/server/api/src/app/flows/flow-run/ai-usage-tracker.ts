import {
    FileType,
    FlowRun,
    FlowVersion,
    isNil,
    LogSliceRef,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { platformPlanService } from '../../ee/platform/platform-plan/platform-plan.service'
import { fileService } from '../../file/file.service'
import { system } from '../../helper/system/system'
import { capturePostHogEvent } from '../../helper/telemetry.utils'
import { projectService } from '../../project/project-service'
import { aiUsageExtractor } from './ai-usage-extractor'
import { flowRunService } from './flow-run-service'

export const aiUsageTracker = (log: FastifyBaseLogger) => ({
    async track({ flowRun, flowVersion }: TrackParams): Promise<void> {
        if (!aiUsageExtractor.flowVersionHasAiStep(flowVersion)) {
            return
        }
        const project = await projectService(log).getOne(flowRun.projectId)
        if (isNil(project)) {
            return
        }
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(project.platformId)
        const licenseKey = platformPlan.licenseKey
        if (isNil(licenseKey) || licenseKey.length === 0) {
            return
        }
        const steps = await flowRunService(log).getStepsOrNull({ flowRun })
        if (isNil(steps)) {
            return
        }
        const usage = await aiUsageExtractor.extractAiUsage({
            steps,
            flowVersion,
            fetchSlice: (ref) => fetchSlice({ log, projectId: flowRun.projectId, ref }),
        })
        if (usage.messages === 0 && usage.toolCalls === 0) {
            return
        }
        capturePostHogEvent({
            distinctId: licenseKey,
            event: AI_USAGE_EVENT_NAME,
            properties: {
                licenseKey,
                platformId: project.platformId,
                projectId: flowRun.projectId,
                edition: system.getEdition(),
                flowRunId: flowRun.id,
                flowId: flowRun.flowId,
                status: flowRun.status,
                environment: flowRun.environment,
                messages: usage.messages,
                toolCalls: usage.toolCalls,
                breakdown: usage.breakdown,
            },
        })
    },
})

async function fetchSlice({ log, projectId, ref }: FetchSliceParams): Promise<unknown> {
    const file = await fileService(log).getDataOrUndefined({
        projectId,
        fileId: ref.fileId,
        type: FileType.FLOW_RUN_LOG_SLICE,
    })
    if (isNil(file)) {
        return undefined
    }
    return JSON.parse(file.data.toString('utf-8'))
}

const AI_USAGE_EVENT_NAME = 'ai_usage_per_run'

type TrackParams = {
    flowRun: FlowRun
    flowVersion: FlowVersion
}

type FetchSliceParams = {
    log: FastifyBaseLogger
    projectId: string
    ref: LogSliceRef
}
