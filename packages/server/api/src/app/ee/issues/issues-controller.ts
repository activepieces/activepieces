import { FastifyPluginAsyncTypebox  } from '@fastify/type-provider-typebox'
import { issuesService } from './issues-service'
import { ListIssuesParams } from '@activepieces/ee-shared'
import { Permission, PrincipalType } from '@activepieces/shared'

export const issuesController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListIssuesRequest, async (req) => {
        return issuesService.list({
            projectId: req.query.projectId,
            cursor: req.query.cursor,
            limit: req.query.limit ?? 10,
        })
    })
    
}

const ListIssuesRequest = {
    config: {
        allowedPrincipals: [
            PrincipalType.USER,
        ],
        permission: Permission.READ_ACTIVITY,
    },
    schema: {
        querystring: ListIssuesParams,
    },
}
