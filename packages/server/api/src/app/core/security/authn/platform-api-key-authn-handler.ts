import { FastifyRequest } from 'fastify'
import { nanoid } from 'nanoid'
import { AppConnectionEntity } from '../../../app-connection/app-connection.entity'
import { extractResourceName } from '../../../authentication/authorization'
import { databaseConnection } from '../../../database/database-connection'
import { apiKeyService } from '../../../ee/api-keys/api-key-service'
import { ProjectMemberEntity } from '../../../ee/project-members/project-member.entity'
import { FlowEntity } from '../../../flows/flow/flow.entity'
import { projectService } from '../../../project/project-service'
import { requestUtils } from '../../request/request-utils'
import { BaseSecurityHandler } from '../security-handler'
import { ApiKey } from '@activepieces/ee-shared'
import {
    ActivepiecesError,
    EndpointScope,
    ErrorCode,
    isNil,
    isObject,
    Principal,
    PrincipalType,
    Project,
    ProjectId,
} from '@activepieces/shared'

export class PlatformApiKeyAuthnHandler extends BaseSecurityHandler {
    private static readonly HEADER_NAME = 'authorization'
    private static readonly HEADER_PREFIX = 'Bearer '
    private static readonly API_KEY_PREFIX = 'sk-'

    protected canHandle(request: FastifyRequest): Promise<boolean> {
        const prefix = `${PlatformApiKeyAuthnHandler.HEADER_PREFIX}${PlatformApiKeyAuthnHandler.API_KEY_PREFIX}`
        const routeMatches =
      request.headers[PlatformApiKeyAuthnHandler.HEADER_NAME]?.startsWith(
          prefix,
      ) ?? false
        const skipAuth = request.routeConfig.skipAuth
        return Promise.resolve(routeMatches && !skipAuth)
    }

    protected async doHandle(request: FastifyRequest): Promise<void> {
        const apiKeyValue = this.extractApiKeyValue(request)
        const apiKey = await apiKeyService.getByValueOrThrow(apiKeyValue)
        const principal = await this.createPrincipal(request, apiKey)
        request.principal = principal
    }

    private extractApiKeyValue(request: FastifyRequest): string {
        const header = request.headers[PlatformApiKeyAuthnHandler.HEADER_NAME]
        const prefix = PlatformApiKeyAuthnHandler.HEADER_PREFIX
        const apiKeyValue = header?.substring(prefix.length)

        if (isNil(apiKeyValue)) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHENTICATION,
                params: {
                    message: 'missing api key',
                },
            })
        }

        return apiKeyValue
    }

    private async createPrincipal(
        request: FastifyRequest,
        apiKey: ApiKey,
    ): Promise<Principal> {
        const principal: Principal = {
            id: apiKey.id,
            type: PrincipalType.SERVICE,
            projectId: 'ANONYMOUS_' + nanoid(),
            platform: {
                id: apiKey.platformId,
            },
        }

        if (request.routeConfig.scope === EndpointScope.PLATFORM) {
            return principal
        }

        try {
            const projectId = await this.extractProjectIdOrThrow(request)
            const project = await projectService.getOneOrThrow(projectId)

            this.assertApiKeyAndProjectBelongToSamePlatform(project, apiKey)

            principal.projectId = projectId
            return principal
        }
        catch (e) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'invalid project id',
                },
            })
        }
    }

    private async extractProjectIdOrThrow(
        request: FastifyRequest,
    ): Promise<ProjectId> {
        const projectId =
      requestUtils.extractProjectId(request) ??
      (await this.extractProjectIdFromResource(request))

        if (isNil(projectId)) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'missing project id',
                },
            })
        }

        return projectId
    }

    private async extractProjectIdFromResource(
        request: FastifyRequest,
    ): Promise<string | undefined> {
        const oneResourceRoute =
      request.routerPath.includes(':id') &&
      isObject(request.params) &&
      'id' in request.params &&
      typeof request.params.id === 'string'

        if (!oneResourceRoute) {
            return undefined
        }

        const resourceName = extractResourceName(request.routerPath)
        const { id } = request.params as { id: string }
        return this.getProjectIdFromResource(resourceName, id)
    }

    private async getProjectIdFromResource(
        resource: string | undefined,
        id: string,
    ): Promise<string | undefined> {
        const tableName = this.getTableNameFromResource(resource)
        if (isNil(tableName)) {
            return undefined
        }
        const entity = await databaseConnection.getRepository(tableName).findOneBy({
            id,
        })
        return entity?.projectId
    }

    private getTableNameFromResource(
        resource: string | undefined,
    ): string | undefined {
        if (isNil(resource)) {
            return undefined
        }
        switch (resource) {
            case 'flows':
                return FlowEntity.options.name
            case 'app-connections':
                return AppConnectionEntity.options.name
            case 'project-members':
                return ProjectMemberEntity.options.name
        }
        return undefined
    }

    private assertApiKeyAndProjectBelongToSamePlatform(
        project: Project,
        apiKey: ApiKey,
    ): void {
        if (project.platformId !== apiKey.platformId) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'invalid project id',
                },
            })
        }
    }
}
