import { ApId, CreateAlertParams, ListAlertsParams, Permission, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ProjectResourceType } from '../../core/security/authorization/common'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { AlertEntity } from './alerts-entity'
import { alertsService } from './alerts-service'

export const alertsController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', ListAlertsRequest, async (req) => {
        return alertsService(req.log).list({
            projectId: req.query.projectId,
            cursor: req.query.cursor,
            limit: req.query.limit ?? 10,
        })
    })

    app.post('/', CreateAlertRequest, async (req) => {
        return alertsService(req.log).add({
            projectId: req.body.projectId,
            channel: req.body.channel,
            receiver: req.body.receiver,
        })
    })

    app.delete('/:id', DeleteAlertRequest, async (req) => {
        return alertsService(req.log).delete({
            alertId: req.params.id,
        })
    })
}

const ListAlertsRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER],
            Permission.READ_ALERT,
            {
                type: ProjectResourceType.QUERY,
            },
        ),
    },
    schema: {
        querystring: ListAlertsParams,
    },
}

const CreateAlertRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER],
            Permission.WRITE_ALERT,
            {
                type: ProjectResourceType.BODY,
            },
        ),
    },
    schema: {
        body: CreateAlertParams,
    },
}

const DeleteAlertRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER],
            Permission.WRITE_ALERT,
            {
                type: ProjectResourceType.TABLE,
                tableName: AlertEntity,
            },
        ),
    },
    schema: {
        params: z.object({
            id: ApId,
        }),
    },
}