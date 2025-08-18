import { ApiKey } from '@activepieces/ee-shared'
import {
    ActivepiecesError,
    assertNotNullOrUndefined,
    EndpointScope,
    ErrorCode,
    isNil,
    isObject,
    Principal,
    PrincipalType,
    Project,
    ProjectId,
} from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { nanoid } from 'nanoid'
import { AppConnectionEntity } from '../../../app-connection/app-connection.entity'
import { extractResourceName } from '../../../authentication/authorization'
import { databaseConnection } from '../../../database/database-connection'
import { apiKeyService } from '../../../ee/api-keys/api-key-service'
import { ProjectMemberEntity } from '../../../ee/projects/project-members/project-member.entity'
import { FlowEntity } from '../../../flows/flow/flow.entity'
import { FlowRunEntity } from '../../../flows/flow-run/flow-run-entity'
import { FolderEntity } from '../../../flows/folder/folder.entity'
import { projectService } from '../../../project/project-service'
import { requestUtils } from '../../request/request-utils'
import { BaseSecurityHandler } from '../security-handler'

export class PlatformApiKeyAuthnHandler extends BaseSecurityHandler {
    private static readonly HEADER_NAME = 'authorization'
    private static readonly HEADER_PREFIX = 'Bearer '
    private static readonly API_KEY_PREFIX = 'sk-'

    protected canHandle(request: FastifyRequest): Promise<boolean> {
        const prefix = `${PlatformApiKeyAuthnHandler.HEADER_PREFIX}${PlatformApiKeyAuthnHandler.API_KEY_PREFIX}`
        const routeMatches = request.headers[PlatformApiKeyAuthnHandler.HEADER_NAME]?.startsWith(prefix) ?? false
        const skipAuth = request.routeOptions.config?.skipAuth ?? false
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

        if (request.routeOptions.config?.scope === EndpointScope.PLATFORM) {
            return principal
        }

        const projectId = await this.extractProjectIdOrThrow(request)

        try {
            const project = await projectService.getOneOrThrow(projectId)

            this.assertApiKeyAndProjectBelongToSamePlatform(project, apiKey)

            principal.projectId = projectId
            return principal
        }
        catch (e) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'invalid api key',
                },
            })
        }
    }

    private async extractProjectIdOrThrow(
        request: FastifyRequest,
    ): Promise<ProjectId> {
        const projectIdFromRequest = requestUtils.extractProjectId(request)
        
        const routerPath = request.routeOptions.url
        assertNotNullOrUndefined(routerPath, 'routerPath is undefined'  )    
        const hasIdParam = routerPath.includes(':id') &&
            isObject(request.params) &&
            'id' in request.params &&
            typeof request.params.id === 'string'
        
        if (hasIdParam) {
            const projectIdFromResource = await this.extractProjectIdFromResource(request)
            if (!isNil(projectIdFromResource)) {
                return projectIdFromResource
            }
            
            const resourceName = extractResourceName(routerPath)
            const resourceId = (request.params as { id: string }).id
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `${resourceId} not found`,
                    entityType: resourceName,
                    entityId: resourceId,
                },
            })
        }
        
        if (isNil(projectIdFromRequest)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'missing project id in request',
                },
            })
        }
        
        return projectIdFromRequest
    }

    private async extractProjectIdFromResource(
        request: FastifyRequest,
    ): Promise<string | undefined> {
        const routerPath = request.routeOptions.url
        assertNotNullOrUndefined(routerPath, 'routerPath is undefined'  )    
        const oneResourceRoute =
            routerPath.includes(':id') &&
            isObject(request.params) &&
            'id' in request.params &&
            typeof request.params.id === 'string'

        if (!oneResourceRoute) {
            return undefined
        }

        const resourceName = extractResourceName(routerPath)
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
        const entity = await databaseConnection().getRepository(tableName).findOneBy({
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
            case 'flow-runs':
                return FlowRunEntity.options.name
            case 'flows':
                return FlowEntity.options.name
            case 'app-connections':
                return AppConnectionEntity.options.name
            case 'project-members':
                return ProjectMemberEntity.options.name
            case 'folders':
                return FolderEntity.options.name
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
                    message: 'invalid project id and platform id',
                },
            })
        }
    }
}
