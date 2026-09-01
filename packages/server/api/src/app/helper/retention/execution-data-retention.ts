import { isNil } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import { Project } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { LessThan, ObjectLiteral, Repository } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { getEffectiveExecutionDataRetentionDays } from '../../file/file.service'
import { ProjectEntity } from '../../project/project-entity'
import { system } from '../system/system'
import { AppSystemProp } from '../system/system-props'

const projectRepo = repoFactory(ProjectEntity)

async function sweep({ repo, alias, scopeCondition, logLabel, log }: SweepParams): Promise<void> {
    const projectsWithShorterRetention = await projectRepo().find({
        select: ['id', 'executionDataRetentionDays'],
        where: { executionDataRetentionDays: LessThan(EXECUTION_DATA_RETENTION_DAYS) },
    })

    const deletionPasses: [number, string[] | undefined][] = [
        ...groupProjectIdsByRetentionDays(projectsWithShorterRetention).entries(),
        [EXECUTION_DATA_RETENTION_DAYS, undefined],
    ]
    const deletedCounts = await Promise.all(deletionPasses.map(([retentionDays, projectIds]) =>
        deleteOlderThan({ repo, alias, scopeCondition, retentionDays, projectIds }),
    ))

    const deletedCount = deletedCounts.reduce((total, count) => total + count, 0)
    if (deletedCount > 0) {
        log.info({ deletedCount }, `[${logLabel}] Removed rows past their project's retention`)
    }
}

function groupProjectIdsByRetentionDays(projects: Pick<Project, 'id' | 'executionDataRetentionDays'>[]): Map<number, string[]> {
    return projects.reduce((byRetentionDays, project) => {
        const days = getEffectiveExecutionDataRetentionDays(project.executionDataRetentionDays)
        return days >= EXECUTION_DATA_RETENTION_DAYS
            ? byRetentionDays
            : byRetentionDays.set(days, [...(byRetentionDays.get(days) ?? []), project.id])
    }, new Map<number, string[]>())
}

// Bounded so a backlog drains across the hourly schedule instead of one statement
// holding locks and WAL for however long it takes.
async function deleteOlderThan<T extends ObjectLiteral>({ repo, alias, scopeCondition, retentionDays, projectIds }: DeleteOlderThanParams<T>): Promise<number> {
    const expiresBefore = apDayjs().subtract(retentionDays, 'days').toISOString()
    const staleIds = repo()
        .createQueryBuilder(alias)
        .select(`${alias}.id`)
        .where(`${alias}.created < :expiresBefore`, { expiresBefore })
        .limit(MAX_DELETED_PER_PASS)
    if (!isNil(scopeCondition)) {
        staleIds.andWhere(scopeCondition.condition, scopeCondition.parameters)
    }
    if (!isNil(projectIds)) {
        staleIds.andWhere(`${alias}."projectId" IN (:...projectIds)`, { projectIds })
    }
    const { affected } = await repo()
        .createQueryBuilder()
        .delete()
        .where(`id IN (${staleIds.getQuery()})`, staleIds.getParameters())
        .execute()
    return affected ?? 0
}

export const executionDataRetention = { sweep }

const EXECUTION_DATA_RETENTION_DAYS = system.getNumberOrThrow(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS)
const MAX_DELETED_PER_PASS = 10_000

type ScopeCondition = {
    condition: string
    parameters: ObjectLiteral
}

type SweepParams = {
    repo: () => Repository<ObjectLiteral>
    alias: string
    scopeCondition?: ScopeCondition
    logLabel: string
    log: FastifyBaseLogger
}

type DeleteOlderThanParams<T extends ObjectLiteral> = {
    repo: () => Repository<T>
    alias: string
    scopeCondition: ScopeCondition | undefined
    retentionDays: number
    projectIds: string[] | undefined
}
