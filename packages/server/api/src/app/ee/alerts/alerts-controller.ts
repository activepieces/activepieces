import { CreateAlertParams, ListAlertsParams } from '@activepieces/ee-shared'
import { ApId, Permission, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { alertsService } from './alerts-service'
import { AuthorizationType, ProjectResourceType, RouteKind } from '@activepieces/server-shared'

export const alertsController: FastifyPluginAsyncTypebox = async (app) => {
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
        security: {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.PROJECT,
                projectResource: {
                    type: ProjectResourceType.QUERY,
                },
                allowedPrincipals: [PrincipalType.USER],
                permission: Permission.READ_ALERT,
            },
        } as const,
    },
    schema: {
        querystring: ListAlertsParams,
    },
}

const CreateAlertRequest = {
    config: {
        security: {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.PROJECT,
                projectResource: {
                    type: ProjectResourceType.BODY,
                },
                allowedPrincipals: [PrincipalType.USER],
                permission: Permission.WRITE_ALERT,
            },
        } as const,
    },
    schema: {
        body: CreateAlertParams,
    },
}

const DeleteAlertRequest = {
    config: {
        security: {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.PROJECT,
                allowedPrincipals: [PrincipalType.USER],
                permission: Permission.WRITE_ALERT,
                projectResource: {
                    type: ProjectResourceType.TABLE,
                    tableName: 'alerts',
                },
            },
        } as const,
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
}