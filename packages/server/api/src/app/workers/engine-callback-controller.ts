import { ActivepiecesError, ErrorCode, SendFlowResponseRequest, UpdateRunProgressRequest, UpdateStepProgressRequest, UploadRunLogsRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { createRunCallbackHandlers } from './rpc/worker-rpc-service'

export const engineCallbackController: FastifyPluginAsyncZod = async (app) => {
    const handlers = createRunCallbackHandlers(app.log)

    app.post('/update-run-progress', engineCallbackRoute(z.custom<UpdateRunProgressRequest>()), async (request, reply) => {
        assertEngineScope(request.principal.projectId, request.body.flowRun.projectId)
        await handlers.updateRunProgress(request.body)
        return reply.status(StatusCodes.OK).send()
    })

    app.post('/upload-run-log', engineCallbackRoute(UploadRunLogsRequest), async (request, reply) => {
        assertEngineScope(request.principal.projectId, request.body.projectId)
        await handlers.uploadRunLog(request.body)
        return reply.status(StatusCodes.OK).send()
    })

    app.post('/send-flow-response', engineCallbackRoute(SendFlowResponseRequest), async (request, reply) => {
        await handlers.sendFlowResponse(request.body)
        return reply.status(StatusCodes.OK).send()
    })

    app.post('/update-step-progress', engineCallbackRoute(UpdateStepProgressRequest), async (request, reply) => {
        assertEngineScope(request.principal.projectId, request.body.projectId)
        await handlers.updateStepProgress(request.body)
        return reply.status(StatusCodes.OK).send()
    })
}

function engineCallbackRoute<T extends z.ZodTypeAny>(body: T) {
    return {
        config: {
            security: securityAccess.engine(),
        },
        schema: { body },
    }
}

function assertEngineScope(principalProjectId: string, bodyProjectId: string): void {
    if (principalProjectId !== bodyProjectId) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: { message: 'Engine token project does not match callback project' },
        })
    }
}
