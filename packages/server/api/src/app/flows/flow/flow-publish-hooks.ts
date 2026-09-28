import { Flow, FlowStatus, FlowVersion, PlatformId, ProjectId, RequiredActionsCheckResult, UserId } from '@activepieces/shared'
import { EntityManager } from 'typeorm'
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

export const flowPublishHooks = hooksFactory.create<FlowPublishHooks>(() => ({
    async assertReferencesResolve(): Promise<void> {
        return
    },
    async findMissingRequiredActions(): Promise<RequiredActionsCheckResult | null> {
        return null
    },
}))

export type RoutePublishParams = {
    flow?: Flow
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

export type FlowPublishHooks = {
    assertReferencesResolve(params: { projectId: ProjectId, agentExternalIds: string[], entityManager: EntityManager }): Promise<void>
    findMissingRequiredActions(params: { projectId: ProjectId, platformId: PlatformId, flowVersion: FlowVersion }): Promise<RequiredActionsCheckResult | null>
}
