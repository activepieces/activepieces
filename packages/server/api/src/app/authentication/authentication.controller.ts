import { ApplicationEventName } from '@activepieces/ee-shared'
import { AppSystemProp, networkUtils } from '@activepieces/server-shared'
import {
    ALL_PRINCIPAL_TYPES,
    assertNotNullOrUndefined,
    SignInRequest,
    SignUpRequest,
    SwitchPlatformRequest,
    SwitchProjectRequest,
    UserIdentityProvider,
    ActivepiecesError,
    ErrorCode,
} from '@activepieces/shared'
import { RateLimitOptions } from '@fastify/rate-limit'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { eventsHooks } from '../helper/application-events'
import { system } from '../helper/system/system'
import { platformService } from '../platform/platform.service'
import { platformUtils } from '../platform/platform.utils'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
import { authenticationService } from './authentication.service'
import { authenticationUtils } from './authentication-utils'
import { externalJwtAuthService } from './external-jwt-auth.service'

export const authenticationController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.post('/sign-up', SignUpRequestOptions, async (request) => {

        const platformId = await platformUtils.getPlatformIdForRequest(request)
        const signUpResponse = await authenticationService(request.log).signUp({
            ...request.body,
            provider: UserIdentityProvider.EMAIL,
            platformId: platformId ?? null,
        })

        eventsHooks.get(request.log).sendUserEvent({
            platformId: signUpResponse.platformId!,
            userId: signUpResponse.id,
            projectId: signUpResponse.projectId,
            ip: networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
        }, {
            action: ApplicationEventName.USER_SIGNED_UP,
            data: {
                source: 'credentials',
            },
        })

        return signUpResponse
    })

    app.post('/sign-in', SignInRequestOptions, async (request) => {

        const predefinedPlatformId = await platformUtils.getPlatformIdForRequest(request)
        const response = await authenticationService(request.log).signInWithPassword({
            email: request.body.email,
            password: request.body.password,
            predefinedPlatformId,
        })

        const responsePlatformId = response.platformId
        assertNotNullOrUndefined(responsePlatformId, 'Platform ID is required')
        eventsHooks.get(request.log).sendUserEvent({
            platformId: responsePlatformId,
            userId: response.id,
            projectId: response.projectId,
            ip: networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
        }, {
            action: ApplicationEventName.USER_SIGNED_IN,
            data: {},
        })

        return response
    })

    app.post('/switch-platform', SwitchPlatformRequestOptions, async (request) => {
        const user = await userService.getOneOrFail({ id: request.principal.id })
        return authenticationService(request.log).switchPlatform({
            identityId: user.identityId,
            platformId: request.body.platformId,
        })
    })

    app.post('/switch-project', SwitchProjectRequestOptions, async (request) => {
        const user = await userService.getOneOrFail({ id: request.principal.id })
        return authenticationService(request.log).switchProject({
            identityId: user.identityId,
            projectId: request.body.projectId,
            currentPlatformId: request.principal.platform.id,
        })
    })

    app.post('/external', ExternalJwtAuthRequestOptions, async (request, reply) => {
        const token = request.headers.authorization?.replace('Bearer ', '') || request.body.token
        
        if (!token) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHENTICATION,
                params: {
                    message: 'Missing JWT token',
                },
            })
        }

        const jwtPayload = await externalJwtAuthService(request.log).verifyJwtToken(token)
        const response = await externalJwtAuthService(request.log).authenticateUser(jwtPayload)

        eventsHooks.get(request.log).sendUserEvent({
            platformId: response.platformId!,
            userId: response.id,
            projectId: response.projectId,
            ip: networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
        }, {
            action: ApplicationEventName.USER_SIGNED_IN,
            data: {
                source: 'external_jwt',
            },
        })

        // Set secure HTTP-only cookie
        const isEmbedMode = system.get(AppSystemProp.SWS_EMBED_MODE) === 'true'
        const cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: isEmbedMode ? 'none' as const : 'lax' as const,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        }

        reply.setCookie('ap_token', response.token, cookieOptions)

        return {
            ok: true,
            redirect: '/flows',
            ...response,
        }
    })

    app.get('/workspaces', WorkspaceListRequestOptions, async (request) => {
        const userId = request.principal.id
        const platforms = await platformService.listPlatformsForIdentityWithAtleastProject({
            identityId: request.principal.identity.id,
        })
        
        return {
            workspaces: platforms.map(platform => ({
                id: platform.id,
                name: platform.name,
                externalId: platform.externalId,
            }))
        }
    })

    app.post('/switch-workspace', SwitchWorkspaceRequestOptions, async (request) => {
        const { workspaceId } = request.body
        const userId = request.principal.id
        
        // Find the platform by ID or external ID
        let platform = await platformService.getOne(workspaceId)
        if (!platform) {
            platform = await platformService.getOneByExternalId(workspaceId)
        }
        
        if (!platform) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHENTICATION,
                params: {
                    message: 'Workspace not found',
                },
            })
        }
        
        // Check if user has access to this platform
        const user = await userService.getOneOrThrow(userId)
        if (user.platformId !== platform.id) {
            // Check if user is a member of this platform
            const platformUsers = await userService.listByPlatformId(platform.id)
            const hasAccess = platformUsers.some(u => u.id === userId)
            
            if (!hasAccess) {
                throw new ActivepiecesError({
                    code: ErrorCode.AUTHENTICATION,
                    params: {
                        message: 'Access denied to workspace',
                    },
                })
            }
        }
        
        // Update user's current platform
        await userService.update(userId, {
            platformId: platform.id,
        })
        
        // Get the first project in this platform
        const projects = await projectService.listByPlatformId(platform.id)
        const project = projects[0]
        
        if (!project) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHENTICATION,
                params: {
                    message: 'No project found in workspace',
                },
            })
        }
        
        return authenticationUtils.getProjectAndToken({
            userId,
            platformId: platform.id,
            projectId: project.id,
        })
    })
}

const rateLimitOptions: RateLimitOptions = {
    max: Number.parseInt(
        system.getOrThrow(AppSystemProp.API_RATE_LIMIT_AUTHN_MAX),
        10,
    ),
    timeWindow: system.getOrThrow(AppSystemProp.API_RATE_LIMIT_AUTHN_WINDOW),
}

const SwitchProjectRequestOptions = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SwitchProjectRequest,
    },
}

const SwitchPlatformRequestOptions = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SwitchPlatformRequest,
    },
}

const SignUpRequestOptions = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SignUpRequest,
    },
}

const SignInRequestOptions = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SignInRequest,
    },
}

const ExternalJwtAuthRequestOptions = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        rateLimit: {
            max: 30, // 30 requests per minute
            timeWindow: '1 minute',
            keyGenerator: (request) => {
                // Rate limit by IP and subject (if available)
                const ip = networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER))
                const token = request.headers.authorization?.replace('Bearer ', '') || request.body?.token
                let subjectKey = 'unknown'
                
                if (token) {
                    try {
                        // Decode JWT to get subject without verification
                        const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
                        subjectKey = decoded.sub || 'unknown'
                    } catch {
                        // If we can't decode, just use unknown
                        subjectKey = 'unknown'
                    }
                }
                
                return `${ip}:${subjectKey}`
            },
        },
    },
    schema: {
        body: Type.Object({
            token: Type.Optional(Type.String()),
        }),
    },
}

const WorkspaceListRequestOptions = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        rateLimit: rateLimitOptions,
    },
    schema: {},
}

const SwitchWorkspaceRequestOptions = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: Type.Object({
            workspaceId: Type.String(),
        }),
    },
}
