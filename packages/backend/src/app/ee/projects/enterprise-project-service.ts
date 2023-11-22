import { Project, ProjectId, UserId } from '@activepieces/shared'
import { Equal, In } from 'typeorm'
import { PlatformId, ProjectMemberStatus } from '@activepieces/ee-shared'
import { ProjectMemberEntity } from '../project-members/project-member.entity'
import { ProjectEntity } from '../../project/project-entity'
import { databaseConnection } from '../../database/database-connection'
// import { ProjectPlanEntity } from '../billing/project-plan/project-plan.entity'

const projectRepo = databaseConnection.getRepository<Project>(ProjectEntity)
const projectMemberRepo =
    databaseConnection.getRepository(ProjectMemberEntity)
// const projectPlanRepo = databaseConnection.getRepository<ProjectPlan>(ProjectPlanEntity)
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
        // const projectsw = await projectRepo.createQueryBuilder().
        //     leftJoinAndSelect('project_plan', 'project_plan', 'project.id = "project_plan"."projectId"')
        //     .where([{
        //         id: In(idsOfProjects),
        //         platformId,
        //     },
        //     {
        //         ownerId,
        //     }])
        //     .getMany()
        // // const resx = await projectPlanRepo.find({})
        // console.log('---------------------------')
        // // console.log(JSON.stringify(resx, null, 2))
        // console.log(JSON.stringify(projectsw, null, 2))
        // console.log('---------------------------')
        return [
            ...projects,
            ...ownedProject,
        ]
    },
    async getProjectIdsByPlatform({ platformId }: { platformId: PlatformId }): Promise<ProjectId[]> {
        const projects = await projectRepo.find({
            where: {
                platformId,
            },
        })
        return projects.map(project => project.id)
    },
}
