import { ActivepiecesError, AlertChannel, ErrorCode, isNil, ProjectType, tryCatch, UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { ProjectHooks } from '../../project/project-hooks'
import { userService } from '../../user/user-service'
import { alertsService } from '../alerts/alerts-service'

export const projectEnterpriseHooks = (log: FastifyBaseLogger): ProjectHooks => ({
    async postCreate(project, context) {
        const isPersonalProject = isNil(project.type) || project.type === ProjectType.PERSONAL
        if (isPersonalProject) {
            const owner = await userService(log).getOneOrFail({ id: project.ownerId })
            const identity = await userIdentityService(log).getOneOrFail({ id: owner.identityId })
            const hasEmail = identity.provider !== UserIdentityProvider.JWT
            if (!hasEmail) {
                return
            }
            await addAlertReceiver({ log, projectId: project.id, email: identity.email })
            return
        }

        const teamProjectAlertReceiverEmail = context?.alertReceiverEmail
        if (isNil(teamProjectAlertReceiverEmail) || teamProjectAlertReceiverEmail.length === 0) {
            return
        }
        await addAlertReceiver({ log, projectId: project.id, email: teamProjectAlertReceiverEmail })
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

type AddAlertReceiverParams = {
    log: FastifyBaseLogger
    projectId: string
    email: string
}
