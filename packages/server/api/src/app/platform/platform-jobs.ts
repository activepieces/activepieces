import { FastifyBaseLogger } from 'fastify'
import { userIdentityRepository } from '../authentication/user-identity/user-identity-service'
import { repoFactory } from '../core/db/repo-factory'
import { transaction } from '../core/db/transaction'
import { SystemJobData, SystemJobName } from '../helper/system-jobs/common'
import { ProjectEntity } from '../project/project-entity'
import { userRepo } from '../user/user-service'
import { PlatformEntity } from './platform.entity'

const projectRepo = repoFactory(ProjectEntity)
const platformRepo = repoFactory(PlatformEntity)

export const platformBackgroundJobs = (log: FastifyBaseLogger) => ({
    hardDeletePlatformHandler: async (data: SystemJobData<SystemJobName.HARD_DELETE_PLATFORM>) => {
        const { platformId, userId, identityId } = data

        const remainingProjects = await projectRepo()
            .createQueryBuilder('project')
            .withDeleted()
            .where({ platformId })
            .getCount()

        if (remainingProjects > 0) {
            log.info({ platformId, remainingProjects }, '[hardDeletePlatformHandler] Projects still exist, retrying later')
            throw new Error(`Platform ${platformId} still has ${remainingProjects} projects, will retry`)
        }

        await transaction(async (entityManager) => {
            await platformRepo(entityManager).delete({ id: platformId })
            await userRepo(entityManager).delete({
                id: userId,
                platformId,
            })
            const usersUsingIdentity = await userRepo(entityManager).find({
                where: {
                    identityId,
                },
                withDeleted: true,
            })
            if (usersUsingIdentity.length === 0) {
                await userIdentityRepository(entityManager).delete({
                    id: identityId,
                })
            }
        })

        log.info({ platformId }, '[hardDeletePlatformHandler] Platform deleted')
    },
})
