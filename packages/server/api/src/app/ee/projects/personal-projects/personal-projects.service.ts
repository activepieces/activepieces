import { apId } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import { PersonalProjectsSummary, ProjectType, UserIdentityProvider, UserStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { IsNull, SelectQueryBuilder } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { distributedLock } from '../../../database/redis-connections'
import { SystemJobData, SystemJobName } from '../../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../../helper/system-jobs/system-job'
import { ProjectEntity } from '../../../project/project-entity'
import { projectService } from '../../../project/project-service'
import { UserSchema } from '../../../user/user-entity'
import { userRepo } from '../../../user/user-service'

const projectRepo = repoFactory(ProjectEntity)

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
    async scheduleCreateMissing({ platformId }: PlatformParams): Promise<void> {
        await systemJobsSchedule(log).upsertJob({
            job: {
                name: SystemJobName.CREATE_MISSING_PERSONAL_PROJECTS,
                data: { platformId },
                jobId: `create-missing-personal-projects-${platformId}-${apId()}`,
            },
            schedule: {
                type: 'one-time',
                date: apDayjs(),
            },
        })
    },
    async createMissingHandler({ platformId }: SystemJobData<SystemJobName.CREATE_MISSING_PERSONAL_PROJECTS>): Promise<void> {
        await distributedLock(log).runExclusive({
            key: `create-missing-personal-projects:${platformId}`,
            timeoutInSeconds: 600,
            fn: async () => {
                const members = await membersWithoutPersonalProjectQuery({ platformId })
                    .select(['user.id AS "userId"', 'identity.firstName AS "firstName"'])
                    .getRawMany<MemberWithoutPersonalProject>()
                log.info({ platformId, count: members.length }, '[personalProjects#createMissing] Creating missing personal projects')
                for (const member of members) {
                    await projectService(log).create({
                        displayName: member.firstName + '\'s Project',
                        ownerId: member.userId,
                        platformId,
                        type: ProjectType.PERSONAL,
                    })
                }
            },
        })
    },
})

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

type MemberWithoutPersonalProject = {
    userId: string
    firstName: string
}
