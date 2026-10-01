import { ActivepiecesError, ErrorCode, isNil, sanitizeObjectForPostgresql, tryCatch } from '@activepieces/core-utils'
import { AgentRunSource, ResumeFlowStepRequest, UpdateFlowStepProgressRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { agentHelpers } from '.././agent-helpers'
import { engineRunCallbackService } from '../../../flows/flow-run/engine-run-callback-service'
import { flowRunService } from '../../../flows/flow-run/flow-run-service'
import { resumeService } from '../../../waitpoints/resume-service'



export const flowStepRpc = (log: FastifyBaseLogger) => ({
    async updateFlowStepProgress(input: UpdateFlowStepProgressRequest): Promise<void> {
        const conversation = await agentHelpers.conversationRepo().findOne({ where: { id: input.conversationId }, select: ['source', 'projectId'] })
        if (conversation?.source !== AgentRunSource.FLOW_STEP || isNil(conversation.projectId)) {
            log.warn({ conversation: { id: input.conversationId }, flowRun: { id: input.flowRunId } }, '[agentRpc#updateFlowStepProgress] Refused progress for a run that is not a flow step')
            throw new ActivepiecesError({ code: ErrorCode.AUTHORIZATION, params: { message: 'Only a flow-step run can report step progress' } })
        }
        const flowRun = await flowRunService(log).getOneOrThrow({ id: input.flowRunId, projectId: conversation.projectId })
        engineRunCallbackService(log).updateStepProgress({
            projectId: conversation.projectId,
            request: { projectId: conversation.projectId, runId: flowRun.id, output: input.output, sequence: input.sequence },
        })
    },

    async resumeFlowStep(input: ResumeFlowStepRequest): Promise<void> {
        const conversation = await agentHelpers.conversationRepo().findOneBy({ id: input.conversationId })
        if (conversation?.source !== AgentRunSource.FLOW_STEP || isNil(conversation.projectId)) {
            throw new ActivepiecesError({ code: ErrorCode.AUTHORIZATION, params: { message: 'Only a flow-step run can resume a flow' } })
        }
        const resumeFields = { conversation: { id: input.conversationId }, flowRun: { id: input.flowRunId }, waitpoint: { id: input.waitpointId } }
        const flowRun = await flowRunService(log).getOne({ id: input.flowRunId, projectId: conversation.projectId })
        if (isNil(flowRun)) {
            log.warn(resumeFields, '[agentRpc#resumeFlowStep] That flow run is gone from this project, so there is nothing left to resume')
            return
        }
        const { data: resumed, error } = await tryCatch(() => resumeService(log).resumeFromWaitpoint({
            flowRunId: flowRun.id,
            waitpointId: input.waitpointId,
            resumePayload: { body: sanitizeObjectForPostgresql(input.output), headers: {}, queryParams: {} },
        }))
        if (!isNil(error)) {
            if (!isFlowRunGone(error)) {
                throw error
            }
            log.warn(resumeFields, '[agentRpc#resumeFlowStep] That flow run went away while resuming, so there is nothing left to resume')
            return
        }
        if (isNil(resumed) || resumed.stale) {
            log.warn(resumeFields, '[agentRpc#resumeFlowStep] Nothing to resume, so the flow keeps waiting unless another attempt already released it')
            return
        }
        log.info(resumeFields, '[agentRpc#resumeFlowStep] Handed the result back to the flow')
    },

})

function isFlowRunGone(error: unknown): boolean {
    return error instanceof ActivepiecesError
        && error.error.code === ErrorCode.ENTITY_NOT_FOUND
        && error.error.params.entityType === FLOW_RUN_ENTITY_TYPE
}

const FLOW_RUN_ENTITY_TYPE = 'flow_run'
