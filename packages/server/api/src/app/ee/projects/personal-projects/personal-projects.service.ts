import { apId, isNil, tryCatch } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
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
                const { error } = await tryCatch(() => systemJobsSchedule(log).upsertJob({
                    job: {
                        name: SystemJobName.CREATE_MISSING_PERSONAL_PROJECTS,
                        data: { platformId },
                        jobId: `create-missing-personal-projects-${platformId}-${apId()}`,
                    },
                    schedule: {
                        type: 'one-time',
                        date: apDayjs(),
                    },
                }))
                if (!isNil(error)) {
                    await platformService(log).update({ id: platformId, autoCreatePersonalProjects: platform.autoCreatePersonalProjects })
                    throw error
                }
            },
        })
    },
    async createMissingHandler({ platformId }: SystemJobData<SystemJobName.CREATE_MISSING_PERSONAL_PROJECTS>): Promise<void> {
        let afterUserId: string | null = null
        for (;;) {
            const lastUserId: string | null = await distributedLock(log).runExclusive({
                key: `create-missing-personal-projects:${platformId}`,
                timeoutInSeconds: 120,
                fn: () => createNextBatch({ platformId, afterUserId, log }),
            })
            if (isNil(lastUserId)) {
                return
            }
            afterUserId = lastUserId
        }
    },
})

async function createNextBatch({ platformId, afterUserId, log }: CreateNextBatchParams): Promise<string | null> {
    const platform = await platformService(log).getOneOrThrow(platformId)
    if (!platform.autoCreatePersonalProjects) {
        log.info({ platform: { id: platformId } }, '[personalProjects#createMissing] Personal projects were turned off, stopping')
        return null
    }
    const query = membersWithoutPersonalProjectQuery({ platformId })
    if (!isNil(afterUserId)) {
        query.andWhere('"user"."id" > :afterUserId', { afterUserId })
    }
    const members = await query
        .select(['user.id AS "userId"', 'identity.firstName AS "firstName"'])
        .orderBy('user.id')
        .limit(CREATE_MISSING_BATCH_SIZE)
        .getRawMany<MemberWithoutPersonalProject>()
    for (const member of members) {
        const { error } = await tryCatch(() => createPersonalProject({ platformId, member, log }))
        if (!isNil(error)) {
            log.warn({ platform: { id: platformId }, user: { id: member.userId }, error }, '[personalProjects#createMissing] Could not create a personal project, skipping this member')
        }
    }
    return members.at(-1)?.userId ?? null
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
    log: FastifyBaseLogger
}

type CreatePersonalProjectParams = {
    platformId: string
    member: MemberWithoutPersonalProject
    log: FastifyBaseLogger
}

type MemberWithoutPersonalProject = {
    userId: string
    firstName: string
}
