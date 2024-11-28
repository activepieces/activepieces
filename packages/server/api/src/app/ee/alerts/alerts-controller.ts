import { CreateAlertParams, ListAlertsParams } from '@activepieces/ee-shared'
import { ApId, Permission, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { alertsService } from './alerts-service'

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
        permission: Permission.READ_ALERT,
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
        permission: Permission.WRITE_ALERT,
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
        permission: Permission.WRITE_ALERT,
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