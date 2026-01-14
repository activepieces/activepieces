import {
    ActivepiecesError,
    ErrorCode,
    isNil,
    PlatformRole,
    PlatformWithoutSensitiveData,
    PrincipalType,
    ProjectType,
} from '@activepieces/shared'
import { FastifyRequest, onRequestAsyncHookHandler } from 'fastify'
import { requestUtils } from '../../core/request/request-utils'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'

export const platformMustHaveFeatureEnabled = (handler: (platform: PlatformWithoutSensitiveData) => boolean): onRequestAsyncHookHandler =>
    async (request, _res) => {
        const platformId = 'platform' in request.principal ? request.principal.platform.id : null

        if (isNil(platformId)) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'Platform ID is required',
                },
            })
        }

        const platform = await platformService.getOneWithPlanOrThrow(platformId)
        const enabled = handler(platform)

        if (!enabled) {
            throw new ActivepiecesError({
                code: ErrorCode.FEATURE_DISABLED,
                params: {
                    message: 'Feature is disabled',
                },
            })
        }
    }

const checkIfPlatformIsOwnedByUser = async (platformId: string, request: FastifyRequest) => {
    if (isNil(platformId)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'Platform ID is required',
            },
        })
    }
    

    const isApiKey = request.principal.type === PrincipalType.SERVICE
    if (isApiKey) {
        return
    }

    const user = await userService.getOneOrFail({
        id: request.principal.id,
    })

    if (isNil(user)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'User is not found',
            },
        })
    }

    const canEditPlatform = user.platformRole === PlatformRole.ADMIN && user.platformId === platformId 
    if (!canEditPlatform) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'User is not owner of the platform',
            },
        })
    }
}

export const projectMustBeTeamType: onRequestAsyncHookHandler =
    async (request, _res) => {
        if (request.principal.type !== PrincipalType.USER && request.principal.type !== PrincipalType.SERVICE) {
            return
        }
        const projectId = requestUtils.extractProjectId(request)

        if (isNil(projectId)) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'Project ID is required',
                },
            })
        }
        const project = await projectService.getOneOrThrow(projectId)
        if (project.type !== ProjectType.TEAM) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Project must be a team project',
                },
            })
        }
    }

export const platformMustBeOwnedByCurrentUser: onRequestAsyncHookHandler =
    async (request, _res) => {
        const principal = request.principal
        if (principal.type !== PrincipalType.USER && principal.type !== PrincipalType.SERVICE) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'You are unauthenticated and cannot access this resource',
                },
            })
        }
        const platformId = principal.platform.id
        await checkIfPlatformIsOwnedByUser(platformId, request)
        
    }

    
export const platformToEditMustBeOwnedByCurrentUser: onRequestAsyncHookHandler =
    async (request, _res) => {
        if (!request.params || typeof request.params !== 'object' || !('id' in request.params) || typeof request.params.id !== 'string') {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'Platform ID is required',
                },
            })
        }
        
        await checkIfPlatformIsOwnedByUser(request.params.id, request)
    }
