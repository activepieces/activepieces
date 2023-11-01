import { Project, UserId } from '@activepieces/shared'
import { Equal, In } from 'typeorm'
import { PlatformId, ProjectMemberStatus } from '@activepieces/ee-shared'
import { ProjectMemberEntity } from '../project-members/project-member.entity'
import { ProjectEntity } from '../../project/project-entity'
import { databaseConnection } from '../../database/database-connection'

const projectRepo = databaseConnection.getRepository<Project>(ProjectEntity)
const projectMemberRepo =
    databaseConnection.getRepository(ProjectMemberEntity)

export const enterpriseProjectService = {
    async getAll({ ownerId, platformId }: { ownerId: UserId, platformId?: PlatformId }): Promise<Project[]> {
        const idsOfProjects = (await projectMemberRepo.findBy({
            userId: ownerId,
            status: Equal(ProjectMemberStatus.ACTIVE),            
        })).map(member => member.projectId)
        const projects = await projectRepo.find({
            where: {
                id: In(idsOfProjects),
                platformId,
            },
        })
        const ownedProject = await projectRepo.find({
            where: {
                ownerId,
            },
        })
        return [
            ...projects,
            ...ownedProject,
        ]
    },
}
