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

async function sweep({ repo, alias, extraWhere, label, log }: SweepParams): Promise<void> {
    const shorterThanDefault = await projectRepo().find({
        select: ['id', 'executionDataRetentionDays'],
        where: { executionDataRetentionDays: LessThan(EXECUTION_DATA_RETENTION_DAYS) },
    })

    const passes: [number, string[] | undefined][] = [
        ...groupProjectIdsByRetentionDays(shorterThanDefault).entries(),
        [EXECUTION_DATA_RETENTION_DAYS, undefined],
    ]
    const deleted = await Promise.all(passes.map(([retentionDays, projectIds]) =>
        deleteOlderThan({ repo, alias, extraWhere, retentionDays, projectIds }),
    ))

    const deletedCount = deleted.reduce((total, count) => total + count, 0)
    if (deletedCount > 0) {
        log.info({ deletedCount }, `[${label}] Removed rows past their project's retention`)
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
async function deleteOlderThan<T extends ObjectLiteral>({ repo, alias, extraWhere, retentionDays, projectIds }: DeleteOlderThanParams<T>): Promise<number> {
    const expiresBefore = apDayjs().subtract(retentionDays, 'days').toISOString()
    const stale = repo()
        .createQueryBuilder(alias)
        .select(`${alias}.id`)
        .where(`${alias}.created < :expiresBefore`, { expiresBefore })
        .limit(MAX_DELETED_PER_PASS)
    if (!isNil(extraWhere)) {
        stale.andWhere(extraWhere.condition, extraWhere.parameters)
    }
    if (!isNil(projectIds)) {
        stale.andWhere(`${alias}."projectId" IN (:...projectIds)`, { projectIds })
    }
    const { affected } = await repo()
        .createQueryBuilder()
        .delete()
        .where(`id IN (${stale.getQuery()})`, stale.getParameters())
        .execute()
    return affected ?? 0
}

export const executionDataRetention = { sweep }

const EXECUTION_DATA_RETENTION_DAYS = system.getNumberOrThrow(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS)
const MAX_DELETED_PER_PASS = 10_000

type ExtraWhere = {
    condition: string
    parameters: ObjectLiteral
}

type SweepParams = {
    repo: () => Repository<ObjectLiteral>
    alias: string
    extraWhere?: ExtraWhere
    label: string
    log: FastifyBaseLogger
}

type DeleteOlderThanParams<T extends ObjectLiteral> = {
    repo: () => Repository<T>
    alias: string
    extraWhere: ExtraWhere | undefined
    retentionDays: number
    projectIds: string[] | undefined
}
