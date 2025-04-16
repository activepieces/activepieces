import { AdminAddPlatformRequestBody, AdminRetryRunsRequestBody, ApEdition, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { system } from '../../helper/system/system'
import { adminPlatformService } from './admin-platform.service'
import { usageService } from '../platform-billing/usage/usage-service'

export const adminPlatformModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(adminPlatformController, { prefix: '/v1/admin/platforms' })
}

const adminPlatformController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    const edition = system.getEdition()
    if (edition === ApEdition.CLOUD) {
        app.post('/', AdminAddPlatformRequest, async (req, res) => {
            const newPlatform = await adminPlatformService(req.log).add(req.body)
            return res.status(StatusCodes.CREATED).send(newPlatform)
        })
        app.post('/reset-redis-usage-tasks', AdminResetRedisUsageTasksRequest, async (req)=>{
            await usageService(req.log).resetRedisUsageTasks({
                projectId: req.body.projectId_for_customer,
                platformId: req.body.platformId,
            })
        })
    }
    app.post('/runs/retry', AdminRetryRunsRequest, async (req, res) => {
        await adminPlatformService(req.log).retryRuns(req.body)
        return res.status(StatusCodes.OK).send()
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



const AdminRetryRunsRequest = {
    schema: {
        body: AdminRetryRunsRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}


const AdminResetRedisUsageTasksRequestBody = Type.Object({
    projectId_for_customer: Type.String(),
    platformId: Type.String(),
})

const AdminResetRedisUsageTasksRequest = {
    schema: {
        body: AdminResetRedisUsageTasksRequestBody,
        },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}
