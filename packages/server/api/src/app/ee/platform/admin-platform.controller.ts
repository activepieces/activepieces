import { AdminAddPlatformRequestBody, AdminRetryRunsRequestBody, ApEdition, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { system } from '../../helper/system/system'
import { adminPlatformService } from './admin-platform.service'
import { appsumoRepo, appsumoService } from '../billing/appsumo/appsumo.service'
import { userService } from '../../user/user-service'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { platformService } from '../../platform/platform.service'
import { platformBillingService } from '../platform-billing/platform-billing.service'

export const adminPlatformModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(adminPlatformController, { prefix: '/v1/admin/platforms' })
}

const adminPlatformController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    const edition = system.getEdition()
    if (edition === ApEdition.CLOUD) {
        app.post('/', AdminAddPlatformRequest, async (req, res) => {
            const appsumos = await appsumoRepo().find()
            let count = 0;
            for (const appsumo of appsumos) {
                const userIdentity = await userIdentityService(req.log).getIdentityByEmail(appsumo.activation_email)
                if (userIdentity) {
                    const platforms = await platformService.listPlatformsForIdentityWithAtleastProject({ identityId: userIdentity.id })
                    if (platforms.length > 0) {
                        const platformBilling = await platformBillingService(req.log).getOrCreateForPlatform(platforms[0].id)
                        if (platformBilling.includedTasks === 1000) {
                            await appsumoService(req.log).handleRequest({
                                plan_id: appsumo.plan_id,
                                action: 'activate',
                                uuid: appsumo.uuid,
                                activation_email: appsumo.activation_email,
                            })
                            count++;
                        }
                    }
                }
            }
            return {
                count
            }
        })
    }
    app.post('/runs/retry', AdminRetryRunsRequest, async (req, res) => {
        await adminPlatformService(req.log).retryRuns(req.body)
        return res.status(StatusCodes.OK).send()
    })
}

const AdminAddPlatformRequest = {
    schema: {
        body: {
            
        },
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
