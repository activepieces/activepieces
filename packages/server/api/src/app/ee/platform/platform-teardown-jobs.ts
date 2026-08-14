import { isNil, unique } from '@activepieces/core-utils'
import { Flow, FlowOperationType, FlowStatus, UserStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { appConnectionsRepo } from '../../app-connection/app-connection-service/app-connection-service'
import { userIdentityRepository } from '../../authentication/user-identity/user-identity-service'
import { repoFactory } from '../../core/db/repo-factory'
import { fileRepo } from '../../file/file.service'
import { flowExecutionCache } from '../../flows/flow/flow-execution-cache'
import { flowSideEffects } from '../../flows/flow/flow-service-side-effects'
import { batchDeleteByFlowId } from '../../flows/flow/flow.jobs'
import { flowRepo } from '../../flows/flow/flow.repo'
import { flowService } from '../../flows/flow/flow.service'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { McpOAuthAuthorizationCodeEntity } from '../../mcp/oauth/code/mcp-oauth-code.entity'
import { McpOAuthTokenEntity } from '../../mcp/oauth/token/mcp-oauth-token.entity'
import { PieceMetadataEntity } from '../../pieces/metadata/piece-metadata-entity'
import { PlatformEntity } from '../../platform/platform.entity'
import { ProjectEntity } from '../../project/project-entity'
import { ToolSearchIndexEntity } from '../../tool-search/tool-search-index.entity'
import { userRepo } from '../../user/user-service'
import { userInvitationRepo } from '../../user-invitations/user-invitation.service'
import { VariableEntity } from '../../variable/variable.entity'
import { apiKeyService } from '../api-keys/api-key-service'
import { ProjectRoleEntity } from '../projects/project-role/project-role.entity'
import { SigningKeyEntity } from '../signing-key/signing-key-entity'
import { ConcurrencyPoolEntity } from './concurrency-pool/concurrency-pool.entity'

const platformRepo = repoFactory(PlatformEntity)
const projectRepo = repoFactory(ProjectEntity)
const pieceMetadataRepo = repoFactory(PieceMetadataEntity)
const signingKeyRepo = repoFactory(SigningKeyEntity)
const projectRoleRepo = repoFactory(ProjectRoleEntity)
const mcpOAuthTokenRepo = repoFactory(McpOAuthTokenEntity)
const mcpOAuthCodeRepo = repoFactory(McpOAuthAuthorizationCodeEntity)
const variableRepo = repoFactory(VariableEntity)
const concurrencyPoolRepo = repoFactory(ConcurrencyPoolEntity)
const toolSearchIndexRepo = repoFactory(ToolSearchIndexEntity)

export const platformTeardownJobs = (log: FastifyBaseLogger) => ({
    hardDeletePlatformHandler: async (data: SystemJobData<SystemJobName.HARD_DELETE_PLATFORM>) => {
        const { platformId } = data

        await cutOffPlatformAccess({ platformId, log })

        const flows = await listFlowsByPlatform(platformId)
        await drainFlows({ flows, log })

        await pieceMetadataRepo().delete({ platformId })
        await appConnectionsRepo().delete({ platformId })

        const projectIds = await listProjectIdsByPlatform(platformId)
        for (const projectId of projectIds) {
            await projectRepo().delete({ id: projectId, platformId })
        }

        await signingKeyRepo().delete({ platformId })

        await fileRepo().delete({ platformId })
        await projectRoleRepo().delete({ platformId })
        await userInvitationRepo().delete({ platformId })
        await mcpOAuthTokenRepo().delete({ platformId })
        await mcpOAuthCodeRepo().delete({ platformId })
        await variableRepo().delete({ platformId })
        await concurrencyPoolRepo().delete({ platformId })
        await toolSearchIndexRepo().delete({ platformId })

        await platformRepo().delete({ id: platformId })

        const identityIds = await deletePlatformUsers(platformId)
        await deleteUnreferencedIdentities(identityIds)

        await flowExecutionCache(log).invalidate(...flows.map((flow) => flow.id))
        log.info({
            platform: { id: platformId },
            flowsCount: flows.length,
            projectsCount: projectIds.length,
        }, '[hardDeletePlatformHandler] Platform purged')
    },
})

export async function cutOffPlatformAccess({ platformId, log }: CutOffPlatformAccessParams): Promise<void> {
    await userRepo().update({ platformId }, { status: UserStatus.INACTIVE })
    await apiKeyService.deleteAllByPlatformId({ platformId })
    await stopPlatformExecution({ platformId, log })
}

async function stopPlatformExecution({ platformId, log }: CutOffPlatformAccessParams): Promise<void> {
    const flows = await listFlowsByPlatform(platformId)
    for (const flow of flows) {
        if (flow.status === FlowStatus.DISABLED || isNil(flow.publishedVersionId)) {
            continue
        }
        await flowService(log).update({
            id: flow.id,
            userId: null,
            projectId: flow.projectId,
            platformId,
            emitEvents: false,
            operation: {
                type: FlowOperationType.CHANGE_STATUS,
                request: { status: FlowStatus.DISABLED },
            },
        })
    }
    await flowExecutionCache(log).invalidate(...flows.map((flow) => flow.id))
}

async function drainFlows({ flows, log }: DrainFlowsParams): Promise<void> {
    for (const flow of flows) {
        await flowSideEffects(log).preDelete({ flowToDelete: flow })
        await batchDeleteByFlowId(flow.id)
        await flowRepo().delete({ id: flow.id })
    }
}

async function listFlowsByPlatform(platformId: string): Promise<Flow[]> {
    return flowRepo()
        .createQueryBuilder('flow')
        .innerJoin('project', 'project', 'project.id = flow."projectId"')
        .where('project."platformId" = :platformId', { platformId })
        .getMany()
}

async function listProjectIdsByPlatform(platformId: string): Promise<string[]> {
    const projects = await projectRepo()
        .createQueryBuilder('project')
        .withDeleted()
        .select('project.id')
        .where({ platformId })
        .getMany()
    return projects.map((project) => project.id)
}

async function deletePlatformUsers(platformId: string): Promise<string[]> {
    const users = await userRepo().find({ where: { platformId }, withDeleted: true })
    await userRepo().delete({ platformId })
    return unique(users.map((user) => user.identityId))
}

async function deleteUnreferencedIdentities(identityIds: string[]): Promise<void> {
    for (const identityId of identityIds) {
        const stillReferenced = await userRepo().existsBy({ identityId })
        if (stillReferenced) {
            continue
        }
        await userIdentityRepository().delete({ id: identityId })
    }
}

type DrainFlowsParams = {
    flows: Flow[]
    log: FastifyBaseLogger
}

type CutOffPlatformAccessParams = {
    platformId: string
    log: FastifyBaseLogger
}
