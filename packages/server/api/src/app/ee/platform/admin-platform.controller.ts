import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { adminPlatformService } from './admin-platform.service'
import { AdminAddPlatformRequestBody, PrincipalType } from '@activepieces/shared'
import { projectUsageService } from '../../project/usage/project-usage-service'

export const adminPlatformPieceModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(adminPlatformController, { prefix: '/v1/admin/platforms' })
}

const adminPlatformController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.post('/', AdminAddPlatformRequest, async (req, res) => {
        const newPlatform = await adminPlatformService.add(req.body)

        return res.status(StatusCodes.CREATED).send(newPlatform)
    })

    app.post('/tasks', DecreaseTasks, async (req, res) => {
        for (const { projectId, tasks } of req.body) {
            await projectUsageService.increaseTasks(projectId, -2 * tasks)
        }

        return res.status(StatusCodes.CREATED).send({})
    })
}

const DecreaseTasks = {
    schema: {
        body: Type.Array(Type.Object({
            projectId: Type.String(),
            tasks: Type.Number()
        }))
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}

const AdminAddPlatformRequest = {
    schema: {
        body: AdminAddPlatformRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}