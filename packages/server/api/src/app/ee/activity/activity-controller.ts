import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { ApId, PrincipalType } from '@activepieces/shared'
import { activityService } from './activity-service'

export const activityController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListActivitiesRequest, async (req) => {
        return activityService.list({
            projectId: req.query.projectId,
            cursor: req.query.cursor ?? null,
            limit: req.query.limit ?? 10,
        })
    })
}

const ListActivitiesRequest = {
    config: {
        allowedPrincipals: [
            PrincipalType.USER,
        ],
    },
    schema: {
        querystring: Type.Object({
            projectId: ApId,
            cursor: Type.Optional(Type.String()),
            limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
        }),
    },
}
