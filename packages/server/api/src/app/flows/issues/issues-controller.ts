import { ApId, ListIssuesParams, Permission, PrincipalType, UpdateIssueRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { issuesService } from './issues-service'

export const issuesController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListIssuesRequest, async (req) => {
        return issuesService(app.log).list({
            projectId: req.query.projectId,
            cursor: req.query.cursor,
            limit: req.query.limit ?? 10,
            status: req.query.status ?? [],
        })
    })

    app.get('/count', CountIssuesRequest, async (req) => {
        return issuesService(app.log).count({
            projectId: req.principal.projectId,
        })
    })

    app.post('/:id', UpdateIssueRequest, async (req) => {
        return issuesService(app.log).updateById({
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
        permission: Permission.READ_ISSUES,
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
        permission:
            Permission.READ_ISSUES,
    },
    
}

const UpdateIssueRequest = {
    config: {
        allowedPrincipals: [
            PrincipalType.USER,
        ],
        permission:
            Permission.WRITE_ISSUES,
     
    },

    schema: {
        params: Type.Object({
            id: ApId,
        }),
        body: UpdateIssueRequestBody,
    },
}
