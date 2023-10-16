import { Project, UserId } from '@activepieces/shared'
import { Equal, In } from 'typeorm'
import { ProjectMemberStatus } from '@activepieces/ee-shared'
import { ProjectMemberEntity } from '../project-members/project-member.entity'
import { ProjectEntity } from '../../project/project-entity'
import { databaseConnection } from '../../database/database-connection'

const projectRepo = databaseConnection.getRepository<Project>(ProjectEntity)
const projectMemberRepo =
    databaseConnection.getRepository(ProjectMemberEntity)

export const enterpriseProjectService = {
    async getAll({ ownerId }: { ownerId: UserId }): Promise<Project[]> {
        const idsOfProjects = (await projectMemberRepo.findBy({
            userId: ownerId,
            status: Equal(ProjectMemberStatus.ACTIVE),
        })).map(member => member.projectId)
        const projects = await projectRepo.find({
            where: {
                id: In(idsOfProjects),
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
