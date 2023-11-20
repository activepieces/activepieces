import { UpdateProjectLimitsRequest } from '@activepieces/ee-shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { plansService } from './project-plan.service'
import { ActivepiecesError, ErrorCode, assertNotNullOrUndefined } from '@activepieces/shared'
import { platformMustBeOwnedByCurrentUser } from '../../authentication/ee-authorization'
import { projectService } from '../../../project/project-service'

export const projectPlanModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('onRequest', platformMustBeOwnedByCurrentUser)
    await app.register(projectPlanController, { prefix: '/v1/project-plans' })
}

const projectPlanController: FastifyPluginAsyncTypebox = async (app) => {

    app.post('/:projectId', {
        schema: {
            params: Type.Object({
                projectId: Type.String(),
            }),
            body: UpdateProjectLimitsRequest,
        },
    }, async (request) => {
        const paltformId = request.principal.platform?.id
        assertNotNullOrUndefined(paltformId, 'Platform Id    is required')
        const project = await projectService.getOneOrthrow(request.params.projectId)
        if (project.platformId !== paltformId) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {},
            })
        }
        return plansService.update({
            projectId: request.params.projectId,
            planLimits: {
                teamMembers: request.body.teamMembers,
                tasks: request.body.tasks,
            },
            subscription: null,
        })

    })

}
