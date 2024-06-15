import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { appsumoRepo, appsumoService } from '../billing/appsumo/appsumo.service'
import { projectBillingService } from '../billing/project-billing/project-billing.service'
import { projectLimitsService } from '../project-plan/project-plan.service'
import { adminPlatformService } from './admin-platform.service'
import { DEFAULT_FREE_PLAN_LIMIT } from '@activepieces/ee-shared'
import { system, SystemProp } from '@activepieces/server-shared'
import { AdminAddPlatformRequestBody, PrincipalType } from '@activepieces/shared'

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

    app.post('/fix', QuickFix, async (req, res) => {
        let count = 0
        let userWithDoubleEmail = 0
        let skippedUser = 0
        let actualRevoked = 0
        for (const uuid of req.body) {
            const appSumoLicense = await appsumoService.getById(uuid)
            if (!appSumoLicense) {
                continue
            }
            const user = await userService.getByPlatformAndEmail({
                platformId: system.getOrThrow(SystemProp.CLOUD_PLATFORM_ID),
                email: appSumoLicense.activation_email,
            })
            if (!user) {
                skippedUser++
                continue
            }
            await appsumoRepo.delete({
                uuid,
            })
            const emailCount = await appsumoRepo.countBy({
                activation_email: appSumoLicense.activation_email,
            })
            if (emailCount > 0) {
                userWithDoubleEmail++
                continue
            }
            const project = await projectService.getUserProjectOrThrow(user.id)
            const billing = await projectBillingService.getOrCreateForProject(project.id)
            if (billing.includedTasks > 1000) {
                actualRevoked++
            }
            await projectLimitsService.upsert(DEFAULT_FREE_PLAN_LIMIT, project.id)
            await projectBillingService.updateByProjectId(project.id, {
                includedTasks: DEFAULT_FREE_PLAN_LIMIT.tasks,
                includedUsers: DEFAULT_FREE_PLAN_LIMIT.teamMembers,
            })
            count++
            
        }
        return res.status(StatusCodes.OK).send({
            skippedUser,
            userWithDoubleEmail,
            actualRevoked,
            count,
        })
    })
}


const QuickFix = {
    schema: {
        body: Type.Array(Type.String()),
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