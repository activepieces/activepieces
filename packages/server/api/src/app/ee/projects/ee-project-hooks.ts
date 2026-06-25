import { ActivepiecesError, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { AlertChannel, ProjectType, UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { ProjectHooks } from '../../project/project-hooks'
import { userService } from '../../user/user-service'
import { alertsService } from '../alerts/alerts-service'
import { pieceSetService } from '../pieces/piece-set/piece-set.service'
import { platformPlanService } from '../platform/platform-plan/platform-plan.service'

export const projectEnterpriseHooks = (log: FastifyBaseLogger): ProjectHooks => ({
    async postCreate(project, context) {
        const isPersonalProject = isNil(project.type) || project.type === ProjectType.PERSONAL
        if (isPersonalProject) {
            const owner = await userService(log).getOneOrFail({ id: project.ownerId })
            const identity = await userIdentityService(log).getOneOrFail({ id: owner.identityId })
            const hasEmail = identity.provider !== UserIdentityProvider.JWT
            if (!hasEmail) {
                await assignDefaultPieceSet({ log, project })
                return
            }
            await addAlertReceiver({ log, projectId: project.id, email: identity.email })
            await assignDefaultPieceSet({ log, project })
            return
        }

        const teamProjectAlertReceiverEmail = context?.alertReceiverEmail
        if (!isNil(teamProjectAlertReceiverEmail) && teamProjectAlertReceiverEmail.length > 0) {
            await addAlertReceiver({ log, projectId: project.id, email: teamProjectAlertReceiverEmail })
        }
        await assignDefaultPieceSet({ log, project })
    },
})

const addAlertReceiver = async ({ log, projectId, email }: AddAlertReceiverParams): Promise<void> => {
    const { error } = await tryCatch(() => alertsService(log).add({
        channel: AlertChannel.EMAIL,
        projectId,
        receiver: email,
    }))
    if (isNil(error)) {
        return
    }
    if (error instanceof ActivepiecesError && error.error.code === ErrorCode.EXISTING_ALERT_CHANNEL) {
        return
    }
    throw error
}

async function assignDefaultPieceSet({ log, project }: AssignDefaultPieceSetParams): Promise<void> {
    const platformPlan = await platformPlanService(log).getOrCreateForPlatform(project.platformId)
    if (!platformPlan.managePiecesEnabled) {
        return
    }
    const defaultSet = await pieceSetService(log).getOrCreateDefaultPieceSet(project.platformId)
    await pieceSetService(log).assignProject({
        pieceSetId: defaultSet.id,
        platformId: project.platformId,
        projectId: project.id,
    })
}

type AddAlertReceiverParams = {
    log: FastifyBaseLogger
    projectId: string
    email: string
}

type AssignDefaultPieceSetParams = {
    log: FastifyBaseLogger
    project: { id: string, platformId: string }
}
