import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { projectLimitsService } from './project-plan.service'
import { ActivepiecesError, ErrorCode, ProjectId } from '@activepieces/shared'

async function limitConnections({
    projectId,
}: {
    projectId: ProjectId
}): Promise<void> {
    const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)
    if (!projectPlan) {
        return
    }
    const connectionQuota = projectPlan.connections
    const connectionCount = await appConnectionService.countByProject({
        projectId,
    })

    if (connectionCount === connectionQuota) {
        throw new ActivepiecesError({
            code: ErrorCode.QUOTA_EXCEEDED,
            params: {
                quota: connectionQuota,
                metric: 'connections',
            },
        })
    }
}

export const connectionsLimits = {
    limitConnections,
}
