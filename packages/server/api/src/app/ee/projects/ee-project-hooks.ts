import { AlertChannel, ApplicationEventName } from '@activepieces/ee-shared'
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
        
        await alertsService(log).create({
            name: 'Default project alert',
            description: 'An alert created by default for this project to notify the project owner about issues with flows by email. Remember that you will get notified immediatly on the first event, after that if same event happens you will get a summary at the end of the day.',
            channel: AlertChannel.EMAIL,
            projectId: project.id,
            receivers: [identity.email],
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
        })
    },
})