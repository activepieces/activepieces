import { apDayjs } from '@activepieces/server-utils'
import { AgentRunSource } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In, LessThan } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { ProjectEntity } from '../../project/project-entity'
import { AgentConversationEntity } from './agent-conversation-entity'

const projectRepo = repoFactory(ProjectEntity)
const conversationRepo = repoFactory(AgentConversationEntity)

export const agentRetention = (log: FastifyBaseLogger) => ({
    async deleteStaleFlowStepConversations(): Promise<void> {
        const shorterThanDefault = await projectRepo().find({
            select: ['id', 'executionDataRetentionDays'],
            where: { executionDataRetentionDays: LessThan(EXECUTION_DATA_RETENTION_DAYS) },
        })

        const passes = [
            ...groupProjectIdsByRetentionDays(shorterThanDefault).entries(),
        ].map(([retentionDays, projectIds]) => ({ retentionDays, projectIds }))

        let deleted = 0
        for (const pass of passes) {
            deleted += await deleteOlderThan({ retentionDays: pass.retentionDays, projectIds: pass.projectIds })
        }
        deleted += await deleteOlderThan({ retentionDays: EXECUTION_DATA_RETENTION_DAYS, projectIds: undefined })

        if (deleted > 0) {
            log.info({ deletedCount: deleted }, '[agentRetention] Removed flow-step conversations past their project\'s retention')
        }
    },
})

async function deleteOlderThan({ retentionDays, projectIds }: { retentionDays: number, projectIds: string[] | undefined }): Promise<number> {
    let deleted = 0
    for (;;) {
        const stale = await conversationRepo().find({
            select: ['id'],
            where: {
                source: AgentRunSource.FLOW_STEP,
                created: LessThan(apDayjs().subtract(retentionDays, 'days').toISOString()),
                ...(projectIds === undefined ? {} : { projectId: In(projectIds) }),
            },
            take: DELETE_BATCH_SIZE,
        })
        if (stale.length === 0) {
            return deleted
        }
        const result = await conversationRepo().delete({ id: In(stale.map((row) => row.id)) })
        deleted += result.affected ?? 0
        if (stale.length < DELETE_BATCH_SIZE) {
            return deleted
        }
    }
}

function groupProjectIdsByRetentionDays(projects: { id: string, executionDataRetentionDays?: number | null }[]): Map<number, string[]> {
    const byRetentionDays = new Map<number, string[]>()
    for (const project of projects) {
        const days = project.executionDataRetentionDays ?? EXECUTION_DATA_RETENTION_DAYS
        if (days >= EXECUTION_DATA_RETENTION_DAYS) {
            continue
        }
        byRetentionDays.set(days, [...(byRetentionDays.get(days) ?? []), project.id])
    }
    return byRetentionDays
}

const EXECUTION_DATA_RETENTION_DAYS = system.getNumberOrThrow(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS)
const DELETE_BATCH_SIZE = 2_000
