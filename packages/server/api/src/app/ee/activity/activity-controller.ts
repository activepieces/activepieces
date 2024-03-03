import { FastifyPluginAsyncTypebox  } from '@fastify/type-provider-typebox'
import { Permission, PrincipalType } from '@activepieces/shared'
import { activityService } from './activity-service'
import { ListActivityParams } from '@activepieces/ee-shared'

export const activityController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListActivitiesRequest, async (req) => {
        return activityService.list({
            projectId: req.query.projectId,
            cursor: req.query.cursor,
            limit: req.query.limit ?? 10,
        })
    })
}

const ListActivitiesRequest = {
    config: {
        allowedPrincipals: [
            PrincipalType.USER,
        ],
        permission: Permission.READ_ACTIVITY,
    },
    schema: {
        querystring: ListActivityParams,
    },
}
