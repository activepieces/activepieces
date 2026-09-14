import { ActivepiecesError, ErrorCode, isNil, sanitizeObjectForPostgresql, spreadIfDefined } from '@activepieces/core-utils'
import { AgentConversationStatus, AgentRunSource, FileCompression, FileType, HeartbeatAgentConversationRequest, SaveAgentFileRequest, SaveAgentFileResponse, SaveAgentMessagesRequest, UpdateAgentProgressRequest, UpdateProjectContextRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { agentHelpers } from '.././agent-helpers'
import { chatAnalyticsTelemetry } from '.././chat-analytics-sync'
import { chatUsageTracker } from '.././chat-usage-tracker'
import { fileService } from '../../../file/file.service'
import { filesService } from '../../../file/files-service'
import { rejectedPromiseHandler } from '../../../helper/promise-handler'

import { updateConversationForRun } from './rpc-shared'


export const conversationRpc = (log: FastifyBaseLogger) => ({
    async saveAgentFile(input: SaveAgentFileRequest): Promise<SaveAgentFileResponse> {
        const conversation = await agentHelpers.conversationRepo().findOneBy({
            id: input.conversationId,
            platformId: input.platformId,
        })
        const projectId = conversation?.projectId ?? input.projectId
        const file = await fileService(log).save({
            projectId,
            platformId: input.platformId,
            data: input.data,
            size: input.data.length,
            type: FileType.FLOW_STEP_FILE,
            fileName: input.fileName,
            compression: FileCompression.NONE,
            metadata: { mimetype: input.mediaType },
        })
        const url = await filesService.constructReadUrl({
            fileId: file.id,
            fileType: file.type,
            platformId: input.platformId,
        })
        return { fileId: file.id, url }
    },

    async saveAgentMessages(input: SaveAgentMessagesRequest): Promise<void> {
        const isSuccessfulCompletion = input.messages.length > 0
        const updates: Record<string, unknown> = {
            status: isSuccessfulCompletion ? AgentConversationStatus.IDLE : AgentConversationStatus.ERROR,
        }

        // No-shrink guard against silent context loss. The LLM history only ever grows within a
        // conversation, so a final/abort/error save whose `messages` are FEWER than what's already
        // persisted means the turn's work was dropped before the save payload was built (an
        // aborted/errored turn whose completed steps never reached the accumulator, or the
        // error-path's empty `{messages:[],uiMessages:[]}` call). Refuse to overwrite content in
        // that case — keep the richer history that updateAgentProgress persisted incrementally. The
        // status still reflects success/error so the UI is correct; only the destructive content
        // overwrite is suppressed. (uiMessages tracks messages, so we gate both on the same check.)
        const storedMessageCount = ((await agentHelpers.conversationRepo().findOneBy({ id: input.conversationId }))?.messages as unknown[] | undefined)?.length ?? 0
        const wouldShrinkHistory = input.messages.length < storedMessageCount
        const persistContent = isSuccessfulCompletion && !wouldShrinkHistory

        if (persistContent) {
            updates.messages = input.messages
            updates.uiMessages = sanitizeObjectForPostgresql(input.uiMessages)
            if (input.title) updates.title = input.title
            if (input.modelName) updates.modelName = input.modelName
        }
        else if (wouldShrinkHistory) {
            log.warn({
                conversation: { id: input.conversationId },
                run: { id: input.runId },
                incomingMessageCount: input.messages.length,
                storedMessageCount,
            }, '[agentRpc#saveAgentMessages] Refused shrinking save — kept incrementally-persisted history')
        }

        const saveLanded = await updateConversationForRun({ conversationId: input.conversationId, runId: input.runId, updates })
        if (!saveLanded) {
            log.warn({ conversation: { id: input.conversationId }, run: { id: input.runId } }, 'saveAgentMessages: no row updated — conversation deleted or superseded by a newer run; skipping analytics and usage tracking')
        }
        log.info({
            conversation: { id: input.conversationId },
            messageCount: input.messages.length,
            uiMessageCount: input.uiMessages.length,
            contentPersisted: persistContent,
            status: updates.status,
            titlePresent: !isNil(input.title),
        }, '[agentRpc#saveAgentMessages] Conversation persisted')

        if (saveLanded && input.messages.length > 0) {
            const conversation = await agentHelpers.conversationRepo().findOneBy({ id: input.conversationId })
            if (conversation) {
                chatAnalyticsTelemetry(log).sendConversationUpdate({ conversation })
                rejectedPromiseHandler(chatUsageTracker(log).track({ conversation, runId: input.runId }), log)
            }
        }
    },

    async updateAgentProgress(input: UpdateAgentProgressRequest): Promise<void> {
        const updates: Record<string, unknown> = {
            uiMessages: JSON.parse(JSON.stringify(input.uiMessages)),
        }
        if (!isNil(input.messages)) {
            updates.messages = input.messages
        }
        await updateConversationForRun({ conversationId: input.conversationId, runId: input.runId, updates })
        log.debug({ conversation: { id: input.conversationId }, uiMessageCount: input.uiMessages.length, messageCount: input.messages?.length }, '[agentRpc#updateAgentProgress] Progress persisted')
    },

    async heartbeatAgentConversation(input: HeartbeatAgentConversationRequest): Promise<void> {
        // Liveness signal: bump `updated` only while STREAMING so stale-recovery in
        // getConversationOrThrow doesn't flip a genuinely-working long turn to IDLE. Gate on the
        // owning run so a superseded run can't keep a row it no longer owns alive.
        const builder = agentHelpers.conversationRepo()
            .createQueryBuilder()
            .update()
            .set({ updated: () => 'now()' })
            .where('id = :id AND status = :streaming', { id: input.conversationId, streaming: AgentConversationStatus.STREAMING })
        if (!isNil(input.runId)) {
            builder.andWhere('("activeRunId" IS NULL OR "activeRunId" = :runId)', { runId: input.runId })
        }
        await builder.execute()
    },

    async updateProjectContext(input: UpdateProjectContextRequest): Promise<void> {
        const conversation = await agentHelpers.conversationRepo().findOneBy({ id: input.conversationId })
        if (conversation?.source === AgentRunSource.FLOW_STEP && input.projectId !== conversation.projectId) {
            log.error({ conversation: { id: input.conversationId }, project: { id: input.projectId } }, '[agentRpc#updateProjectContext] Refused a project switch on a flow-step run')
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: { message: 'A flow-step agent run cannot move to another project' },
            })
        }
        if (!isNil(conversation)) {
            await agentHelpers.assertProjectSwitchKeepsKey({
                platformId: conversation.platformId,
                fromProjectId: conversation.projectId ?? null,
                toProjectId: input.projectId,
                ...spreadIfDefined('provider', input.provider),
                ...spreadIfDefined('providerConfigId', input.providerConfigId),
                log,
            })
        }
        await updateConversationForRun({ conversationId: input.conversationId, runId: input.runId, updates: { projectId: input.projectId } })
        log.info({ conversation: { id: input.conversationId }, project: input.projectId ? { id: input.projectId } : undefined }, '[agentRpc#updateProjectContext] Project context updated')
    },

})
