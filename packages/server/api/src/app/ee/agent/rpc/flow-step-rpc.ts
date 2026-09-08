import { ActivepiecesError, ErrorCode, isNil, sanitizeObjectForPostgresql } from '@activepieces/core-utils'
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
        const flowRun = await flowRunService(log).getOneOrThrow({ id: input.flowRunId, projectId: conversation.projectId })
        const { stale } = await resumeService(log).resumeFromWaitpoint({
            flowRunId: flowRun.id,
            waitpointId: input.waitpointId,
            resumePayload: { body: sanitizeObjectForPostgresql(input.output), headers: {}, queryParams: {} },
        })
        const resumeFields = { conversation: { id: input.conversationId }, flowRun: { id: flowRun.id }, waitpoint: { id: input.waitpointId } }
        if (stale) {
            log.warn(resumeFields, '[agentRpc#resumeFlowStep] Nothing to resume, so the flow keeps waiting unless another attempt already released it')
            return
        }
        log.info(resumeFields, '[agentRpc#resumeFlowStep] Handed the result back to the flow')
    },

})
