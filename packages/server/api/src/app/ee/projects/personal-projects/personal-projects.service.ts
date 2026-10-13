import { apId, assertNotNullOrUndefined, isNil, tryCatch } from '@activepieces/core-utils'
import { apDayjs, apDayjsDuration } from '@activepieces/server-utils'
import { PersonalProjectsSummary, ProjectType, UserIdentityProvider, UserStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull, SelectQueryBuilder } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { distributedLock } from '../../../database/redis-connections'
import { SystemJobData, SystemJobName } from '../../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../../helper/system-jobs/system-job'
import { platformService } from '../../../platform/platform.service'
import { ProjectEntity } from '../../../project/project-entity'
import { projectService } from '../../../project/project-service'
import { UserSchema } from '../../../user/user-entity'
import { userRepo } from '../../../user/user-service'

const projectRepo = repoFactory(ProjectEntity)
const CREATE_MISSING_BATCH_SIZE = 50
const CREATE_MISSING_ATTEMPTS = 10
const CREATE_MISSING_RETRY_DELAY = apDayjsDuration(5, 'minute').asMilliseconds()

export const personalProjectsService = (log: FastifyBaseLogger) => ({
    async summary({ platformId }: PlatformParams): Promise<PersonalProjectsSummary> {
        const personalProjectCount = await projectRepo().countBy({
            platformId,
            type: ProjectType.PERSONAL,
            deleted: IsNull(),
        })
        const membersWithoutPersonalProject = await membersWithoutPersonalProjectQuery({ platformId }).getCount()
        return { personalProjectCount, membersWithoutPersonalProject }
    },
    async turnOnAndCreateMissing({ platformId }: PlatformParams): Promise<void> {
        await platformService(log).runWithDefaultProjectsLock({
            platformId,
            fn: async () => {
                const platform = await platformService(log).getOneOrThrow(platformId)
                await platformService(log).update({ id: platformId, autoCreatePersonalProjects: true })
                const { error } = await tryCatch(() => scheduleCreateMissing({ platformId, log }))
                if (!isNil(error)) {
                    await platformService(log).update({ id: platformId, autoCreatePersonalProjects: platform.autoCreatePersonalProjects })
                    throw error
                }
            },
        })
    },
    async createMissingHandler(data: SystemJobData<SystemJobName.CREATE_MISSING_PERSONAL_PROJECTS>): Promise<void> {
        const job = await systemJobsSchedule(log).getJob<SystemJobName.CREATE_MISSING_PERSONAL_PROJECTS>(createMissingJobId(data))
        assertNotNullOrUndefined(job, 'job is required')
        let progress = data
        for (;;) {
            const batch: CreatedBatch = await distributedLock(log).runExclusive({
                key: `create-missing-personal-projects:${data.platformId}`,
                timeoutInSeconds: 120,
                fn: () => createNextBatch({ platformId: data.platformId, afterUserId: progress.afterUserId ?? null, onlyUserIds: progress.onlyUserIds, log }),
            })
            if (batch.turnedOff) {
                return
            }
            if (isNil(batch.lastUserId)) {
                break
            }
            progress = {
                ...progress,
                afterUserId: batch.lastUserId,
                failedUserIds: [...progress.failedUserIds ?? [], ...batch.failedUserIds],
            }
            await job.updateData(progress)
        }
        const failedUserIds = progress.failedUserIds ?? []
        if (failedUserIds.length === 0) {
            return
        }
        await job.updateData({ platformId: data.platformId, runId: data.runId, onlyUserIds: failedUserIds })
        throw new Error(`[personalProjects#createMissing] Could not create a personal project for ${failedUserIds.length} member(s), retrying only them`)
    },
})

async function scheduleCreateMissing({ platformId, log }: ScheduleCreateMissingParams): Promise<void> {
    const data = { platformId, runId: apId() }
    await systemJobsSchedule(log).upsertJob({
        job: {
            name: SystemJobName.CREATE_MISSING_PERSONAL_PROJECTS,
            data,
            jobId: createMissingJobId(data),
        },
        schedule: {
            type: 'one-time',
            date: apDayjs(),
        },
        customConfig: {
            attempts: CREATE_MISSING_ATTEMPTS,
            backoff: {
                type: 'fixed',
                delay: CREATE_MISSING_RETRY_DELAY,
            },
        },
    })
}

function createMissingJobId({ platformId, runId }: CreateMissingRunParams): string {
    return `create-missing-personal-projects-${platformId}-${runId}`
}

async function createNextBatch({ platformId, afterUserId, onlyUserIds, log }: CreateNextBatchParams): Promise<CreatedBatch> {
    const platform = await platformService(log).getOneOrThrow(platformId)
    if (!platform.autoCreatePersonalProjects) {
        log.info({ platform: { id: platformId } }, '[personalProjects#createMissing] Personal projects were turned off, stopping')
        return { lastUserId: null, failedUserIds: [], turnedOff: true }
    }
    const query = membersWithoutPersonalProjectQuery({ platformId })
    if (!isNil(afterUserId)) {
        query.andWhere('"user"."id" > :afterUserId', { afterUserId })
    }
    if (!isNil(onlyUserIds)) {
        query.andWhere('"user"."id" = ANY(:onlyUserIds)', { onlyUserIds })
    }
    const members = await query
        .select(['user.id AS "userId"', 'identity.firstName AS "firstName"'])
        .orderBy('user.id')
        .limit(CREATE_MISSING_BATCH_SIZE)
        .getRawMany<MemberWithoutPersonalProject>()
    const results: MemberResult[] = []
    for (const member of members) {
        const { error } = await tryCatch(() => createPersonalProject({ platformId, member, log }))
        if (!isNil(error)) {
            log.warn({ platform: { id: platformId }, user: { id: member.userId }, error }, '[personalProjects#createMissing] Could not create a personal project, retrying this member later')
        }
        results.push({ userId: member.userId, failed: !isNil(error) })
    }
    return {
        lastUserId: members.at(-1)?.userId ?? null,
        failedUserIds: results.filter((result) => result.failed).map((result) => result.userId),
        turnedOff: false,
    }
}

async function createPersonalProject({ platformId, member, log }: CreatePersonalProjectParams): Promise<void> {
    const user = await userRepo().findOneBy({ id: member.userId })
    if (isNil(user) || user.platformId !== platformId || user.status !== UserStatus.ACTIVE) {
        return
    }
    const project = await projectService(log).create({
        displayName: member.firstName + '\'s Project',
        ownerId: member.userId,
        platformId,
        type: ProjectType.PERSONAL,
        callPostCreateHooks: false,
    })
    const { error } = await tryCatch(() => projectService(log).callProjectPostCreateHooks(project))
    if (!isNil(error)) {
        await projectRepo().delete({ id: project.id, platformId })
        throw error
    }
}

function membersWithoutPersonalProjectQuery({ platformId }: PlatformParams): SelectQueryBuilder<UserSchema> {
    return userRepo()
        .createQueryBuilder('user')
        .innerJoin('user_identity', 'identity', 'identity.id = "user"."identityId"')
        .where('"user"."platformId" = :platformId', { platformId })
        .andWhere('"user"."status" = :status', { status: UserStatus.ACTIVE })
        .andWhere('identity.provider != :embeddedProvider', { embeddedProvider: UserIdentityProvider.JWT })
        .andWhere(`NOT EXISTS (
            SELECT 1 FROM project
            WHERE project."ownerId" = "user"."id"
                AND project."platformId" = "user"."platformId"
                AND project."type" = :personal
                AND project."deleted" IS NULL
        )`, { personal: ProjectType.PERSONAL })
}

type PlatformParams = {
    platformId: string
}

type CreateNextBatchParams = {
    platformId: string
    afterUserId: string | null
    onlyUserIds?: string[]
    log: FastifyBaseLogger
}

type CreatePersonalProjectParams = {
    platformId: string
    member: MemberWithoutPersonalProject
    log: FastifyBaseLogger
}

type MemberResult = {
    userId: string
    failed: boolean
}

type ScheduleCreateMissingParams = {
    platformId: string
    log: FastifyBaseLogger
}

type CreateMissingRunParams = {
    platformId: string
    runId: string
}

type CreatedBatch = {
    lastUserId: string | null
    failedUserIds: string[]
    turnedOff: boolean
}

type MemberWithoutPersonalProject = {
    userId: string
    firstName: string
}
