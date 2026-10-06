import { ActivepiecesError, apId, ErrorCode, isNil, isObject, sanitizeObjectForPostgresql } from '@activepieces/core-utils'
import { MAX_AGENT_TURN_WALL_CLOCK_MS, SubagentTask, SubagentTaskArtifact, SubagentTaskStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { repoFactory } from '../../core/db/repo-factory'
import { agentHelpers } from './agent-helpers'
import { AgentTaskEntity } from './agent-task-entity'

const agentTaskRepo = repoFactory(AgentTaskEntity)

async function begin({ platformId, conversationId, title, taskId }: {
    platformId: string
    conversationId: string
    title: string
    taskId?: string
}): Promise<{ taskId: string, claimId: string, messages: Record<string, unknown>[] }> {
    const claimId = apId()
    if (isNil(taskId)) {
        const conversation = await agentHelpers.conversationRepo().findOneBy({ id: conversationId, platformId })
        if (isNil(conversation)) {
            throw new ActivepiecesError({ code: ErrorCode.ENTITY_NOT_FOUND, params: { entityType: 'agent_conversation', entityId: conversationId } })
        }
        const id = apId()
        await agentTaskRepo().insert({
            id,
            platformId,
            projectId: conversation.projectId ?? null,
            conversationId,
            title,
            status: SubagentTaskStatus.RUNNING,
            messages: [],
            summary: null,
            artifacts: [],
            claimId,
        })
        return { taskId: id, claimId, messages: [] }
    }
    const staleBefore = dayjs().subtract(MAX_AGENT_TURN_WALL_CLOCK_MS, 'millisecond').toISOString()
    const claimed = await agentTaskRepo().createQueryBuilder()
        .update()
        .set({ status: SubagentTaskStatus.RUNNING, title, claimId })
        .where('id = :taskId AND "platformId" = :platformId AND "conversationId" = :conversationId', { taskId, platformId, conversationId })
        .andWhere('(status != :running OR updated < :staleBefore)', { running: SubagentTaskStatus.RUNNING, staleBefore })
        .returning(['id', 'messages'])
        .execute()
    const claimedRows: unknown = claimed.raw
    const row: unknown = Array.isArray(claimedRows) && claimedRows.length === 1 ? claimedRows[0] : undefined
    if (!isObject(row)) {
        throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: `Task ${taskId} does not exist in this conversation or is still running` } })
    }
    const messages = Array.isArray(row['messages']) ? row['messages'].filter(isObject) : []
    return { taskId, claimId, messages }
}

async function finish({ platformId, conversationId, taskId, claimId, status, messages, summary, artifacts }: {
    platformId: string
    conversationId: string
    taskId: string
    claimId: string
    status: SubagentTaskStatus
    messages: Record<string, unknown>[]
    summary: string | null
    artifacts: SubagentTaskArtifact[]
}): Promise<void> {
    const updates: Record<string, unknown> = {
        status,
        messages: sanitizeObjectForPostgresql(messages),
        summary,
        artifacts: sanitizeObjectForPostgresql(artifacts),
    }
    await agentTaskRepo().createQueryBuilder()
        .update()
        .set(updates)
        .where('id = :taskId AND "platformId" = :platformId AND "conversationId" = :conversationId AND "claimId" = :claimId', { taskId, platformId, conversationId, claimId })
        .execute()
}

async function list({ platformId, conversationId }: { platformId: string, conversationId: string }): Promise<Pick<SubagentTask, 'id' | 'title' | 'status'>[]> {
    return agentTaskRepo().find({
        where: { platformId, conversationId },
        select: ['id', 'title', 'status'],
        order: { created: 'ASC' },
    })
}

export const agentTaskService = {
    begin,
    finish,
    list,
}
