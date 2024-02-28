import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'
import {
    ActivepiecesError,
    ErrorCode,
    assertNotNullOrUndefined,
} from '@activepieces/shared'
import { auditLogService } from './audit-event-service'
import { ListAuditEventsRequest } from '@activepieces/ee-shared'
import { platformService } from '../../platform/platform.service'

export const auditEventModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustBeOwnedByCurrentUser)
    await app.register(auditEventController, { prefix: '/v1/audit-events' })
}

const auditEventController: FastifyPluginAsyncTypebox = async (app) => {
    app.get(
        '/',
        {
            schema: {
                querystring: ListAuditEventsRequest,
            },
        },
        async (request) => {
            const platformId = request.principal.platform.id
            assertNotNullOrUndefined(platformId, 'platformId')
            await assertAuditLogEnabled(platformId)
            return auditLogService.list({
                platformId,
                cursorRequest: request.query.cursor ?? null,
                limit: request.query.limit ?? 20,
            })
        },
    )
}

async function assertAuditLogEnabled(platformId: string): Promise<void> {
    const platform = await platformService.getOneOrThrow(platformId)

    if (!platform.auditLogEnabled) {
        throw new ActivepiecesError({
            code: ErrorCode.FEATURE_DISABLED,
            params: {
                message: 'Audit log addon feature is disabled',
            },
        })
    }
}
