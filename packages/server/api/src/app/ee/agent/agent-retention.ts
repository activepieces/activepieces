import { isNil } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import { AgentRunSource, Project } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { LessThan } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { getEffectiveExecutionDataRetentionDays } from '../../file/file.service'
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

        const passes: [number, string[] | undefined][] = [
            ...groupProjectIdsByRetentionDays(shorterThanDefault).entries(),
            [EXECUTION_DATA_RETENTION_DAYS, undefined],
        ]
        const deleted = await Promise.all(passes.map(([retentionDays, projectIds]) => deleteOlderThan({ retentionDays, projectIds })))

        const deletedCount = deleted.reduce((total, count) => total + count, 0)
        if (deletedCount > 0) {
            log.info({ deletedCount }, '[agentRetention] Removed flow-step conversations past their project\'s retention')
        }
    },
})

// Bounded so a backlog built up before retention existed drains across the hourly schedule
// instead of one statement holding locks and WAL for however long it takes.
async function deleteOlderThan({ retentionDays, projectIds }: { retentionDays: number, projectIds: string[] | undefined }): Promise<number> {
    const expiresBefore = apDayjs().subtract(retentionDays, 'days').toISOString()
    const stale = conversationRepo()
        .createQueryBuilder('conversation')
        .select('conversation.id')
        .where('conversation.source = :source', { source: AgentRunSource.FLOW_STEP })
        .andWhere('conversation.created < :expiresBefore', { expiresBefore })
        .limit(MAX_DELETED_PER_PASS)
    if (!isNil(projectIds)) {
        stale.andWhere('conversation.projectId IN (:...projectIds)', { projectIds })
    }
    const { affected } = await conversationRepo()
        .createQueryBuilder()
        .delete()
        .where(`id IN (${stale.getQuery()})`, stale.getParameters())
        .execute()
    return affected ?? 0
}

function groupProjectIdsByRetentionDays(projects: Pick<Project, 'id' | 'executionDataRetentionDays'>[]): Map<number, string[]> {
    return projects.reduce((byRetentionDays, project) => {
        const days = getEffectiveExecutionDataRetentionDays(project.executionDataRetentionDays)
        return days >= EXECUTION_DATA_RETENTION_DAYS
            ? byRetentionDays
            : byRetentionDays.set(days, [...(byRetentionDays.get(days) ?? []), project.id])
    }, new Map<number, string[]>())
}

const EXECUTION_DATA_RETENTION_DAYS = system.getNumberOrThrow(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS)
const MAX_DELETED_PER_PASS = 10_000
