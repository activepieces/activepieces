import { FastifyPluginAsyncTypebox  } from '@fastify/type-provider-typebox'
import { PrincipalType } from '@activepieces/shared'
import { activityService } from './activity-service'
import { ListActivityParams } from '@activepieces/ee-shared'

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
        querystring: ListActivityParams,
    },
}
