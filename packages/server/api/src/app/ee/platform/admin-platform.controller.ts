import { AdminAddPlatformRequestBody, FlowStatus, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { adminPlatformService } from './admin-platform.service'
import { flowService } from '../../flows/flow/flow.service'

export const adminPlatformPieceModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(adminPlatformController, { prefix: '/v1/admin/platforms' })
}

const adminPlatformController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.post('/', AdminAddPlatformRequest, async (req, res) => {
        const newPlatform = await adminPlatformService(req.log).add(req.body)

        return res.status(StatusCodes.CREATED).send(newPlatform)
    })

    app.post('/enable-flows', TurnOnFlowsRequest, async (req, res) => {
        const { flowIds } = req.body
        let count = 0;
        for (const flowId of flowIds) {
            const currentFlow = await flowService(req.log).getOneById(flowId)
            if (currentFlow && currentFlow.status !== FlowStatus.ENABLED) {
                await flowService(req.log).updateStatus({
                    id: flowId,
                    projectId: currentFlow.projectId,
                    newStatus: FlowStatus.ENABLED,
                })
                count++;
            }
        }
        return res.status(StatusCodes.OK).send({ message: `Flows enabled: ${count}` })
    })
}

const AdminAddPlatformRequest = {
    schema: {
        body: AdminAddPlatformRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}

const TurnOnFlowsRequest = {
    schema: {
        body: Type.Object({
            flowIds: Type.Array(Type.String()),
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}
