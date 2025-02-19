import { AlertChannel } from '@activepieces/ee-shared'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { ProjectHooks } from '../../project/project-hooks'
import { userService } from '../../user/user-service'
import { alertsService } from '../alerts/alerts-service'

export const projectEnterpriseHooks = (log: FastifyBaseLogger): ProjectHooks => ({
    async postCreate(project) {
        const owner = await userService.getOneOrFail({
            id: project.ownerId,
        })
        const identity = await userIdentityService(log).getBasicInformation(owner.identityId)
        await alertsService(log).add({
            channel: AlertChannel.EMAIL,
            projectId: project.id,
            receiver: identity.email,
        })
    },
})