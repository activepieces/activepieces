import { projectMemberService } from '@/ee/teams/backend/project-member.service';
import { FastifyInstance } from 'fastify'
import { projectService } from './project.service'

export const projectController = async (fastify: FastifyInstance) => {
    fastify.get('/', async (request) => {
        const projectIds = (await projectMemberService.listByUserId(request.principal.id)).map((projectMember) => projectMember.projectId)
        const myProjects =  await projectService.getUserProject(request.principal.id)
        const memberProjects = await projectService.getAll(projectIds)
        return [...myProjects, ...memberProjects]
    })
}
