import { AlertChannel } from '@activepieces/ee-shared'
import { FastifyBaseLogger } from 'fastify'
import { ProjectHooks } from '../../project/project-hooks'
import { userService } from '../../user/user-service'
import { alertsService } from '../alerts/alerts-service'

export const projectEnterpriseHooks = (log: FastifyBaseLogger): ProjectHooks => ({
    async postCreate(project) {
        const owner = await userService.getOneOrFail({
            id: project.ownerId,
        })
        await alertsService(log).add({
            channel: AlertChannel.EMAIL,
            projectId: project.id,
            receiver: owner.email,
        })
    },
})