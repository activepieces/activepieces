import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { issuesService } from './issues-service'
import { ListIssuesParams, UpdateIssueRequestBody } from '@activepieces/ee-shared'
import { ApId, PrincipalType } from '@activepieces/shared'

export const issuesController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListIssuesRequest, async (req) => {
        return issuesService.list({
            projectId: req.query.projectId,
            cursor: req.query.cursor,
            limit: req.query.limit ?? 10,
        })
    })

    app.get('/count', CountIssuesRequest, async (req) => {
        return issuesService.count({
            projectId: req.principal.projectId,
        })
    })

    app.post('/:id', UpdateIssueRequest, async (req) => {
        return issuesService.updateById({
            id: req.params.id,
            status: req.body.status,
            projectId: req.principal.projectId,
        })
    })
}

const ListIssuesRequest = {
    config: {
        allowedPrincipals: [
            PrincipalType.USER,
        ],
    },
    schema: {
        querystring: ListIssuesParams,
    },
}


const CountIssuesRequest = {
    config: {
        allowedPrincipals: [
            PrincipalType.USER,
        ],
    },
}

const UpdateIssueRequest = {
    config: {
        allowedPrincipals: [
            PrincipalType.USER,
        ],
    },

    schema: {
        params: Type.Object({
            id: ApId,
        }),
        body: UpdateIssueRequestBody,
    },
}
