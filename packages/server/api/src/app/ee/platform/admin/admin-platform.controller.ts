import { AdminRetryRunsRequestBody, ApplyLicenseKeyByEmailRequestBody, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { adminPlatformService } from './admin-platform.service'

export const adminPlatformModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(adminPlatformController, { prefix: '/v1/admin/platforms' })
}

const adminPlatformController: FastifyPluginAsyncTypebox = async (
    app,
) => {

    app.post('/runs/retry', AdminRetryRunsRequest, async (req, res) => {
        await adminPlatformService(req.log).retryRuns(req.body)
        return res.status(StatusCodes.OK).send()
    })

    app.post('/apply-license-key', ApplyLicenseKeyByEmailRequest, async (req, res) => {
        await adminPlatformService(req.log).applyLicenseKeyByEmail(req.body)
        return res.status(StatusCodes.OK).send()
    })
}



const AdminRetryRunsRequest = {
    schema: {
        body: AdminRetryRunsRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}

const ApplyLicenseKeyByEmailRequest = {
    schema: {
        body: ApplyLicenseKeyByEmailRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}

