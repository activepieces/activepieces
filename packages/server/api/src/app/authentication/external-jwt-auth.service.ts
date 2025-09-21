import { ActivepiecesError, apId, assertNotNullOrUndefined, ErrorCode, PlatformRole, UserIdentityProvider, AuthenticationResponse } from '@activepieces/shared'
import { AppSystemProp, cryptoUtils } from '@activepieces/server-shared'
import { FastifyBaseLogger } from 'fastify'
import * as jwt from 'jsonwebtoken'
import * as jwksClient from 'jwks-rsa'
import { system } from '../helper/system/system'
import { platformService } from '../platform/platform.service'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
import { userIdentityService } from './user-identity/user-identity-service'
import { authenticationUtils } from './authentication-utils'

export interface ExternalJwtPayload {
    sub: string
    email: string
    given_name: string
    family_name: string
    workspace_id: string
    iss: string
    aud: string
    exp: number
    iat: number
}

export const externalJwtAuthService = (log: FastifyBaseLogger) => ({
    async verifyJwtToken(token: string): Promise<ExternalJwtPayload> {
        const issuer = system.getOrThrow(AppSystemProp.IDP_ISSUER)
        const audience = system.getOrThrow(AppSystemProp.IDP_AUDIENCE)
        const jwksUrl = system.getOrThrow(AppSystemProp.IDP_JWKS_URL)

        // Log JWT verification attempt (without token)
        log.info({
            issuer,
            audience,
            jwksUrl,
            tokenLength: token.length,
            tokenPrefix: token.substring(0, 20) + '...',
        }, 'JWT verification attempt')

        // Create JWKS client
        const client = jwksClient({
            jwksUri: jwksUrl,
            cache: true,
            cacheMaxAge: 600000, // 10 minutes
            rateLimit: true,
            jwksRequestsPerMinute: 5,
        })

        // Get the signing key
        const getKey = (header: any, callback: any) => {
            client.getSigningKey(header.kid, (err, key) => {
                if (err) {
                    log.error({ error: err.message, kid: header.kid }, 'Failed to get signing key')
                    return callback(err)
                }
                const signingKey = key?.getPublicKey()
                callback(null, signingKey)
            })
        }

        try {
            const decoded = jwt.verify(token, getKey, {
                issuer,
                audience,
                algorithms: ['RS256', 'RS384', 'RS512'],
            }) as ExternalJwtPayload

            // Log successful verification (without sensitive data)
            log.info({
                sub: decoded.sub,
                iss: decoded.iss,
                aud: decoded.aud,
                workspace_id: decoded.workspace_id,
                email: decoded.email,
                exp: decoded.exp,
                iat: decoded.iat,
            }, 'JWT verification successful')

            return decoded
        } catch (error) {
            log.error({ 
                error: error.message,
                issuer,
                audience,
                tokenLength: token.length,
            }, 'JWT verification failed')
            throw new ActivepiecesError({
                code: ErrorCode.AUTHENTICATION,
                params: {
                    message: 'Invalid JWT token',
                },
            })
        }
    },

    async authenticateUser(jwtPayload: ExternalJwtPayload): Promise<AuthenticationResponse> {
        const { sub, email, given_name, family_name, workspace_id, iss } = jwtPayload

        // Log authentication attempt
        log.info({
            sub,
            email,
            iss,
            workspace_id,
            hasWorkspaceId: !!workspace_id,
        }, 'External JWT authentication attempt')

        // First, try to find existing user by external issuer and subject
        let user = await userService.getOneByExternalIssuerAndSubject(iss, sub)
        
        if (user) {
            // User exists, determine which platform to use
            let targetPlatform = null
            
            if (workspace_id) {
                // If workspace_id is provided, try to find or create that platform
                targetPlatform = await platformService.getOneByExternalId(workspace_id)
                
                if (!targetPlatform) {
                    // Create new platform for this workspace_id
                    targetPlatform = await platformService.create({
                        ownerId: user.id,
                        name: `${given_name}'s Workspace`,
                        externalId: workspace_id,
                    })
                    
                    // Add user as owner to the new platform
                    await userService.addOwnerToPlatform({
                        platformId: targetPlatform.id,
                        id: user.id,
                    })
                }
            } else {
                // No workspace_id provided, use user's last used platform
                targetPlatform = await platformService.getLastUsedPlatformForUser(user.id)
                
                if (!targetPlatform) {
                    // Create default platform
                    targetPlatform = await platformService.create({
                        ownerId: user.id,
                        name: `${email}-default`,
                    })
                    
                    // Add user as owner to the new platform
                    await userService.addOwnerToPlatform({
                        platformId: targetPlatform.id,
                        id: user.id,
                    })
                }
            }
            
            // Update user's current platform
            await userService.update(user.id, {
                platformId: targetPlatform.id,
            })
            
            const projects = await projectService.listByPlatformId(targetPlatform.id)
            let project = projects[0]
            
            if (!project) {
                // Create default project if none exists
                project = await projectService.create({
                    displayName: `${given_name}'s Project`,
                    ownerId: user.id,
                    platformId: targetPlatform.id,
                })
            }

            const response = authenticationUtils.getProjectAndToken({
                userId: user.id,
                platformId: targetPlatform.id,
                projectId: project.id,
            })

            // Log successful authentication
            log.info({
                userId: user.id,
                platformId: targetPlatform.id,
                projectId: project.id,
                isExistingUser: true,
                workspaceId: targetPlatform.externalId,
            }, 'External JWT authentication successful')

            return response
        }

        // User doesn't exist, create new user and platform
        // Upsert user identity
        let userIdentity = await userIdentityService(log).getIdentityByEmail(email)
        if (!userIdentity) {
            userIdentity = await userIdentityService(log).create({
                email,
                firstName: given_name,
                lastName: family_name,
                password: await cryptoUtils.generateRandomPassword(),
                provider: UserIdentityProvider.JWT,
                verified: true,
            })
        } else {
            // Update profile fields if empty
            if (!userIdentity.firstName && given_name) {
                await userIdentityService(log).update(userIdentity.id, {
                    firstName: given_name,
                })
            }
            if (!userIdentity.lastName && family_name) {
                await userIdentityService(log).update(userIdentity.id, {
                    lastName: family_name,
                })
            }
        }

        // Create new user with external issuer and subject
        user = await userService.create({
            identityId: userIdentity.id,
            platformRole: PlatformRole.ADMIN,
            platformId: null,
            externalId: `${iss}:${sub}`,
            externalIss: iss,
            externalSub: sub,
        })
        
        // Determine platform to create
        let platform = null
        
        if (workspace_id) {
            // Check if platform with this workspace_id already exists
            platform = await platformService.getOneByExternalId(workspace_id)
            
            if (!platform) {
                // Create new platform for this workspace_id
                platform = await platformService.create({
                    ownerId: user.id,
                    name: `${given_name}'s Workspace`,
                    externalId: workspace_id,
                })
            }
        } else {
            // Create default platform
            platform = await platformService.create({
                ownerId: user.id,
                name: `${email}-default`,
            })
        }

        await userService.addOwnerToPlatform({
            platformId: platform.id,
            id: user.id,
        })

        // Update user's current platform
        await userService.update(user.id, {
            platformId: platform.id,
        })

        // Create default project
        const project = await projectService.create({
            displayName: `${given_name}'s Project`,
            ownerId: user.id,
            platformId: platform.id,
        })

        const response = authenticationUtils.getProjectAndToken({
            userId: user.id,
            platformId: platform.id,
            projectId: project.id,
        })

        // Log successful new user authentication
        log.info({
            userId: user.id,
            platformId: platform.id,
            projectId: project.id,
            isExistingUser: false,
            workspaceId: platform.externalId,
            userIdentityId: userIdentity.id,
        }, 'External JWT authentication successful - new user created')

        return response
    },
})
