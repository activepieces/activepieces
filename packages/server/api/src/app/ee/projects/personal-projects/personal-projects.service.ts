import { apId, isNil, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import { PersonalProjectsSummary, ProjectType, UserIdentityProvider, UserStatus } from '@activepieces/shared'
import { Dayjs } from 'dayjs'
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
const CREATE_MISSING_RETRY_ATTEMPTS = 5
const CREATE_MISSING_RETRY_DELAY_MINUTES = 5

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
                const { error } = await tryCatch(() => scheduleCreateMissing({ platformId, date: apDayjs(), log }))
                if (!isNil(error)) {
                    await platformService(log).update({ id: platformId, autoCreatePersonalProjects: platform.autoCreatePersonalProjects })
                    throw error
                }
            },
        })
    },
    async createMissingHandler({ platformId, onlyUserIds, afterUserId: resumeAfterUserId, attemptsLeft }: SystemJobData<SystemJobName.CREATE_MISSING_PERSONAL_PROJECTS>): Promise<void> {
        let afterUserId: string | null = resumeAfterUserId ?? null
        let failedUserIds: string[] = []
        const { error } = await tryCatch(async () => {
            for (;;) {
                const batch: CreatedBatch = await distributedLock(log).runExclusive({
                    key: `create-missing-personal-projects:${platformId}`,
                    timeoutInSeconds: 120,
                    fn: () => createNextBatch({ platformId, afterUserId, onlyUserIds, log }),
                })
                failedUserIds = [...failedUserIds, ...batch.failedUserIds]
                if (isNil(batch.lastUserId)) {
                    return
                }
                afterUserId = batch.lastUserId
            }
        })
        const remainingAttempts = attemptsLeft ?? CREATE_MISSING_RETRY_ATTEMPTS
        if (failedUserIds.length > 0) {
            await scheduleFollowUp({ platformId, onlyUserIds: failedUserIds, attemptsLeft: remainingAttempts, log })
        }
        if (!isNil(error)) {
            log.warn({ platform: { id: platformId }, user: { id: afterUserId }, error }, '[personalProjects#createMissing] Stopped part-way, resuming from the last member reached')
            await scheduleFollowUp({ platformId, onlyUserIds, afterUserId: afterUserId ?? undefined, attemptsLeft: remainingAttempts, log })
        }
    },
})

async function scheduleFollowUp({ platformId, onlyUserIds, afterUserId, attemptsLeft, log }: ScheduleFollowUpParams): Promise<void> {
    if (attemptsLeft === 0) {
        log.error({ platform: { id: platformId }, users: { ids: onlyUserIds }, user: { id: afterUserId } }, '[personalProjects#createMissing] Giving up on creating the remaining personal projects')
        return
    }
    await scheduleCreateMissing({
        platformId,
        date: apDayjs().add(CREATE_MISSING_RETRY_DELAY_MINUTES, 'minute'),
        data: { onlyUserIds, afterUserId, attemptsLeft: attemptsLeft - 1 },
        log,
    })
}

async function scheduleCreateMissing({ platformId, date, data, log }: ScheduleCreateMissingParams): Promise<void> {
    await systemJobsSchedule(log).upsertJob({
        job: {
            name: SystemJobName.CREATE_MISSING_PERSONAL_PROJECTS,
            data: {
                platformId,
                ...spreadIfDefined('onlyUserIds', data?.onlyUserIds),
                ...spreadIfDefined('afterUserId', data?.afterUserId),
                ...spreadIfDefined('attemptsLeft', data?.attemptsLeft),
            },
            jobId: `create-missing-personal-projects-${platformId}-${apId()}`,
        },
        schedule: {
            type: 'one-time',
            date,
        },
        customConfig: {
            attempts: 1,
        },
    })
}

async function createNextBatch({ platformId, afterUserId, onlyUserIds, log }: CreateNextBatchParams): Promise<CreatedBatch> {
    const platform = await platformService(log).getOneOrThrow(platformId)
    if (!platform.autoCreatePersonalProjects) {
        log.info({ platform: { id: platformId } }, '[personalProjects#createMissing] Personal projects were turned off, stopping')
        return { lastUserId: null, failedUserIds: [] }
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
    }
}

async function createPersonalProject({ platformId, member, log }: CreatePersonalProjectParams): Promise<void> {
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

type CreatedBatch = {
    lastUserId: string | null
    failedUserIds: string[]
}

type ScheduleCreateMissingParams = {
    platformId: string
    date: Dayjs
    data?: {
        onlyUserIds?: string[]
        afterUserId?: string
        attemptsLeft?: number
    }
    log: FastifyBaseLogger
}

type ScheduleFollowUpParams = {
    platformId: string
    onlyUserIds?: string[]
    afterUserId?: string
    attemptsLeft: number
    log: FastifyBaseLogger
}

type MemberWithoutPersonalProject = {
    userId: string
    firstName: string
}
