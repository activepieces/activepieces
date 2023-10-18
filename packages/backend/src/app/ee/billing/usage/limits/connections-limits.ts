import { ActivepiecesError, ErrorCode, ProjectId } from '@activepieces/shared'
import { plansService } from '../../plans/plan.service'
import { appConnectionService } from '../../../../app-connection/app-connection-service/app-connection-service'

async function limitConnections({ projectId }: { projectId: ProjectId }): Promise<void> {
    const { connections: connectionQuota } = await plansService.getOrCreateDefaultPlan({ projectId })
    const connectionCount = await appConnectionService.countByProject({ projectId })

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