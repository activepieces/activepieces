import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { alertsService } from './alerts-service'
import { CreateAlertParams, ListAlertsParams } from '@activepieces/ee-shared'
import { ApId, PrincipalType } from '@activepieces/shared'

export const alertsController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListAlertsRequest, async (req) => {
        return alertsService.list({
            projectId: req.query.projectId,
            cursor: req.query.cursor,
            limit: req.query.limit ?? 10,
        })
    })

    app.post('/', CreateAlertRequest, async (req) => {
        return alertsService.add({
            projectId: req.body.projectId,
            channel: req.body.channel,
            receiver: req.body.receiver,
        })
    })

    app.delete('/:id', DeleteAlertRequest, async (req) => {
        return alertsService.delete({
            alertId: req.params.id,
        })
    })
}

const ListAlertsRequest = {
    config: {
        allowedPrincipals: [
            PrincipalType.USER,
        ],
    },
    schema: {
        querystring: ListAlertsParams,
    },
}

const CreateAlertRequest = {
    config: {
        allowedPrincipals: [
            PrincipalType.USER,
        ],
    },
    schema: {
        body: CreateAlertParams,
    },
}

const DeleteAlertRequest = {
    config: {
        allowedPrincipals: [
            PrincipalType.USER,
        ],
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
}