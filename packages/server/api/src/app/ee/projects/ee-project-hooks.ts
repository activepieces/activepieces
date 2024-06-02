import { ProjectHooks } from '../../project/project-hooks'
import { userService } from '../../user/user-service'
import { alertsService } from '../alerts/alerts-service'
import { AlertChannel } from '@activepieces/ee-shared'

export const projectEnterpriseHooks: ProjectHooks = {
    async postCreate(project) {
        const owner = await userService.getOneOrFail({
            id: project.ownerId,
        })
        await alertsService.add({
            channel: AlertChannel.EMAIL,
            projectId: project.id,
            receiver: owner.email,
        })
    },
}