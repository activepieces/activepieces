import { Permission } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { PublishHooks, RoutePublishParams, SubmitForApprovalParams } from '../../../flows/flow/flow-publish-hooks'
import { platformService } from '../../../platform/platform.service'
import { projectService } from '../../../project/project-service'
import { getPrincipalRoleOrThrow } from '../../authentication/project-role/rbac-middleware'
import { flowApprovalRequestService } from './flow-approval-request.service'

export const eeFlowPublishHook = (log: FastifyBaseLogger): PublishHooks => ({
    async routePublish({ projectId, platformId, userId }: RoutePublishParams) {
        const platform = await platformService(log).getOneWithPlanOrThrow(platformId)
        if (!platform.plan.environmentsEnabled) {
            return 'PUBLISH_NOW'
        }
        const project = await projectService(log).getOneOrThrow(projectId)
        if (!project.sensitive) {
            return 'PUBLISH_NOW'
        }
        if (!userId) {
            return 'PUBLISH_NOW'
        }
        const hasOverride = await userHasPublishSensitivePermission({ userId, projectId, log })
        return hasOverride ? 'PUBLISH_NOW' : 'NEEDS_APPROVAL'
    },
    async submitForApproval({ flow, userId, projectId, platformId, requestedStatus }: SubmitForApprovalParams) {
        await flowApprovalRequestService(log).submitForApproval({ flow, userId, projectId, platformId, requestedStatus })
    },
})

const userHasPublishSensitivePermission = async ({ userId, projectId, log }: { userId: string, projectId: string, log: FastifyBaseLogger }): Promise<boolean> => {
    try {
        const role = await getPrincipalRoleOrThrow(userId, projectId, log)
        return role.permissions?.includes(Permission.PUBLISH_SENSITIVE_FLOW_ACCESS) ?? false
    }
    catch {
        return false
    }
}
