import { Flow, FlowStatus, PlatformId, ProjectId, UserId } from '@activepieces/shared'
import { hooksFactory } from '../../helper/hooks-factory'

export type PublishRoute = 'PUBLISH_NOW' | 'NEEDS_APPROVAL'

export type PublishHooks = {
    routePublish(params: RoutePublishParams): Promise<PublishRoute>
    submitForApproval(params: SubmitForApprovalParams): Promise<void>
}

export const publishHooksFactory = hooksFactory.create<PublishHooks>(_log => ({
    async routePublish(_params: RoutePublishParams): Promise<PublishRoute> {
        return 'PUBLISH_NOW'
    },
    async submitForApproval(_params: SubmitForApprovalParams): Promise<void> {
        return
    },
}))

export type RoutePublishParams = {
    flow: Flow
    projectId: ProjectId
    platformId: PlatformId
    userId: UserId | null
}

export type SubmitForApprovalParams = {
    flow: Flow
    userId: UserId | null
    projectId: ProjectId
    platformId: PlatformId
    requestedStatus: FlowStatus
}
