import { ActivepiecesError, apId, ErrorCode, isNil, PlatformId, spreadIfDefined, spreadIfNotUndefined, tryCatch, UserId } from '@activepieces/core-utils'
import { ApEdition, AuthenticationResponse, OPEN_SOURCE_PLAN, Platform, PlatformPlanLimits, PlatformRole, PlatformUsage, PlatformWithoutFederatedAuth, PlatformWithoutSensitiveData, ProjectType, SsoDomainVerification, SsoDomainVerificationStatus, UpdatePlatformRequestBody, User, UserStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { nanoid } from 'nanoid'
import { authenticationUtils } from '../authentication/authentication-utils'
import { userIdentityRepository, userIdentityService } from '../authentication/user-identity/user-identity-service'
import { repoFactory } from '../core/db/repo-factory'
import { distributedLock } from '../database/redis-connections'
import { invalidateSamlClientCache } from '../ee/authentication/saml-authn/saml-client'
import { platformPlanService } from '../ee/platform/platform-plan/platform-plan.service'
import { defaultTheme } from '../flags/theme'
import { system } from '../helper/system/system'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
import { billingProvider } from './billing-provider'
import { PlatformEntity } from './platform.entity'

export const platformRepo = repoFactory<Platform>(PlatformEntity)

export const platformService = (log: FastifyBaseLogger) => ({
    async listPlatformsForIdentityWithAtleastProject(params: ListPlatformsForIdentityParams): Promise<PlatformWithoutSensitiveData[]> {
        const users = await userService(log).getByIdentityId({ identityId: params.identityId })

        const platformsWithProjects = await Promise.all(users.map(async (user) => {
            if (isNil(user.platformId) || user.status === UserStatus.INACTIVE) {
                return null
            }
            const hasProjects = await projectService(log).userHasProjects({
                platformId: user.platformId,
                userId: user.id,
                isPrivileged: userService(log).isUserPrivileged(user),
            })
            return hasProjects ? user.platformId : null
        }))

        const platforms = await Promise.all(platformsWithProjects.filter((platformId) => !isNil(platformId)).map((platformId) => this.getOneWithPlanOrThrow(platformId)))
        return platforms
    },
    async create(params: AddParams): Promise<PlatformWithoutFederatedAuth> {
        const {
            ownerId,
            name,
            primaryColor,
            logoIconUrl,
            fullLogoUrl,
            favIconUrl,
        } = params

        const newPlatform: NewPlatform = {
            id: apId(),
            ownerId,
            name,
            primaryColor: primaryColor ?? defaultTheme.colors.primary.default,
            logoIconUrl: logoIconUrl ?? defaultTheme.logos.logoIconUrl,
            fullLogoUrl: fullLogoUrl ?? defaultTheme.logos.fullLogoUrl,
            favIconUrl: favIconUrl ?? defaultTheme.logos.favIconUrl,
            emailAuthEnabled: true,
            enforceAllowedAuthDomains: false,
            allowedAuthDomains: [],
            federatedAuthProviders: { saml: null },
            cloudAuthEnabled: true,
            pinnedPieces: [],
            pieceSelectorConfig: null,
            allowedEmbedOrigins: [],
            googleAuthEnabled: true,
        }

        const savedPlatform = await platformRepo().save(newPlatform)
        await userService(log).addOwnerToPlatform({
            id: ownerId,
            platformId: savedPlatform.id,
        })

        await platformPlanService(log).onPlatformCreated(savedPlatform.id)

        log.info({ platform: { id: savedPlatform.id }, ownerId }, 'Platform created')
        return stripFederatedAuth(savedPlatform)
    },
    async createPlatformWithProject({ identityId, name, invalidatePreviousTokens, isFirstPlatform, callerTokenVersion, beforeProvision }: CreatePlatformWithProjectParams): Promise<CreatePlatformWithProjectResult> {
        return distributedLock(log).runExclusive({
            key: `create-platform-${identityId}`,
            timeoutInSeconds: 30,
            fn: async () => {
                const existingUsers = isFirstPlatform ? await userService(log).getByIdentityId({ identityId }) : []
                const linkedUser = existingUsers.find((user) => !isNil(user.platformId))
                if (!isNil(linkedUser) && !isNil(linkedUser.platformId)) {
                    // Rotate here only when the caller's own token is still the
                    // current one. That means provisioning finished without ever
                    // rotating — an interrupted attempt — so retiring the
                    // credential now stands nothing up. If a rotation has already
                    // happened, this is a duplicate of a call that issued a
                    // session, and rotating again would kill it.
                    const identity = await userIdentityService(log).getOneOrFail({ id: identityId })
                    const rotationStillOwed = invalidatePreviousTokens
                        && isSameTokenVersion(identity.tokenVersion, callerTokenVersion)
                    const response = await finishExistingPlatform({ user: linkedUser, platformId: linkedUser.platformId, name, invalidatePreviousTokens: rotationStillOwed, identityId, log })
                    return { response, provisioned: false }
                }
                const unlinkedUser = existingUsers.find((user) => isNil(user.platformId))
                const orphanedPlatform = isNil(unlinkedUser) ? null : await platformRepo().findOneBy({ ownerId: unlinkedUser.id })
                if (!isNil(unlinkedUser) && !isNil(orphanedPlatform)) {
                    await beforeProvision?.()
                    await userService(log).addOwnerToPlatform({ id: unlinkedUser.id, platformId: orphanedPlatform.id })
                    const response = await finishExistingPlatform({
                        user: await userService(log).getOneOrFail({ id: unlinkedUser.id }),
                        platformId: orphanedPlatform.id,
                        name,
                        invalidatePreviousTokens,
                        identityId,
                        log,
                    })
                    return { response, provisioned: true }
                }
                await beforeProvision?.()
                const newUser = unlinkedUser
                    ?? await userService(log).create({
                        identityId,
                        platformRole: PlatformRole.ADMIN,
                        platformId: null,
                    })
                const platform = await this.create({ ownerId: newUser.id, name })
                const defaultProject = await projectService(log).create({
                    displayName: personalProjectName(name),
                    ownerId: newUser.id,
                    platformId: platform.id,
                    type: ProjectType.PERSONAL,
                })
                if (invalidatePreviousTokens) {
                    await userIdentityRepository().update(identityId, {
                        tokenVersion: nanoid(),
                    })
                }
                await authenticationUtils(log).sendTelemetry({
                    identity: await userIdentityService(log).getOneOrFail({ id: identityId }),
                    user: newUser,
                    projectId: defaultProject.id,
                })
                const response = await authenticationUtils(log).getProjectAndToken({
                    userId: newUser.id,
                    platformId: platform.id,
                    projectId: defaultProject.id,
                })
                return { response, provisioned: true }
            },
        })
    },
    async getAll(): Promise<PlatformWithoutFederatedAuth[]> {
        return platformRepo().find()
    },
    async getOldestPlatform(): Promise<PlatformWithoutFederatedAuth | null> {
        return platformRepo().findOne({
            where: {},
            order: {
                created: 'ASC',
            },
        })
    },
    async update(params: UpdateParams): Promise<PlatformWithoutFederatedAuth> {
        if (params.federatedAuthProviders?.saml !== undefined) {
            const plan = await platformPlanService(log).getOrCreateForPlatform(params.id)
            if (!plan.ssoEnabled) {
                throw new ActivepiecesError({
                    code: ErrorCode.FEATURE_DISABLED,
                    params: {
                        message: 'SSO is not enabled for this platform',
                    },
                })
            }
            if (!isNil(params.federatedAuthProviders.saml)) {
                const platform = await this.getOneOrThrow(params.id)
                if (platform.ssoDomainVerification?.status !== SsoDomainVerificationStatus.VERIFIED) {
                    throw new ActivepiecesError({
                        code: ErrorCode.VALIDATION,
                        params: {
                            message: 'SSO domain must be verified before configuring SAML',
                        },
                    })
                }
            }
        }
        const platform = params.federatedAuthProviders !== undefined
            ? await this.getOneWithFederatedAuthOrThrow(params.id)
            : await this.getOneOrThrow(params.id)
        const federatedAuthProviders = hasFederatedAuth(platform)
            ? {
                ...platform.federatedAuthProviders,
                ...(params.federatedAuthProviders ?? {}),
            }
            : undefined
        const updatedPlatform = {
            ...platform,
            ...spreadIfDefined('federatedAuthProviders', federatedAuthProviders),
            ...spreadIfDefined('name', params.name),
            ...spreadIfDefined('primaryColor', params.primaryColor),
            ...spreadIfNotUndefined('themeColors', params.themeColors),
            ...spreadIfDefined('logoIconUrl', params.logoIconUrl),
            ...spreadIfDefined('fullLogoUrl', params.fullLogoUrl),
            ...spreadIfDefined('favIconUrl', params.favIconUrl),
            ...spreadIfDefined('cloudAuthEnabled', params.cloudAuthEnabled),
            ...spreadIfDefined('googleAuthEnabled', params.googleAuthEnabled),
            ...spreadIfDefined('emailAuthEnabled', params.emailAuthEnabled),
            ...spreadIfDefined(
                'enforceAllowedAuthDomains',
                params.enforceAllowedAuthDomains,
            ),
            ...spreadIfDefined('allowedAuthDomains', params.allowedAuthDomains),
            ...spreadIfDefined('allowedEmbedOrigins', params.allowedEmbedOrigins),
            ...spreadIfDefined('ssoDomain', params.ssoDomain),
            ...spreadIfDefined('ssoDomainVerification', params.ssoDomainVerification),
            ...spreadIfDefined('pinnedPieces', params.pinnedPieces),
            ...spreadIfNotUndefined('pieceSelectorConfig', params.pieceSelectorConfig),
        }
        if (!isNil(params.plan)) {
            await platformPlanService(log).update({
                platformId: params.id,
                ...params.plan,
            })
        }
        if (!isNil(params.federatedAuthProviders?.saml)) {
            invalidateSamlClientCache(params.id)
        }
        log.info({ platform: { id: params.id } }, 'Platform updated')
        const saved = await platformRepo().save(updatedPlatform)
        return stripFederatedAuth(saved)
    },
    async getOneOrThrow(id: PlatformId): Promise<PlatformWithoutFederatedAuth> {
        return platformRepo().findOneByOrFail({ id })
    },
    async getOne(id: PlatformId): Promise<PlatformWithoutFederatedAuth | null> {
        return platformRepo().findOneBy({ id })
    },
    async getOneWithFederatedAuthOrThrow(id: PlatformId): Promise<Platform> {
        return platformRepo()
            .createQueryBuilder('platform')
            .addSelect('platform.federatedAuthProviders')
            .where({ id })
            .getOneOrFail()
    },
    async hasSamlConfigured(id: PlatformId): Promise<boolean> {
        const result = await platformRepo()
            .createQueryBuilder('platform')
            .select('platform."federatedAuthProviders"', 'federatedAuthProviders')
            .where({ id })
            .getRawOne<{ federatedAuthProviders: { saml?: unknown } | null }>()
        return !isNil(result?.federatedAuthProviders?.saml)
    },
    async getOneWithPlan(id: PlatformId): Promise<PlatformWithoutSensitiveData | null> {
        const platform = await this.getOne(id)
        if (isNil(platform)) {
            return null
        }
        const [samlConfigured, plan, usage] = await Promise.all([
            this.hasSamlConfigured(id),
            getPlan(log, platform),
            getUsage(log, platform),
        ])
        return {
            ...platform,
            federatedAuthProviders: { saml: samlConfigured ? {} : null },
            usage,
            plan,
        }
    },
    async getOneWithPlanOrThrow(id: PlatformId): Promise<Omit<PlatformWithoutSensitiveData, 'usage'>> {
        const platform = await this.getOneOrThrow(id)
        const [samlConfigured, plan] = await Promise.all([
            this.hasSamlConfigured(id),
            getPlan(log, platform),
        ])
        return {
            ...platform,
            federatedAuthProviders: { saml: samlConfigured ? {} : null },
            plan,
        }
    },
    async getOneWithPlanAndUsageOrThrow(id: PlatformId): Promise<PlatformWithoutSensitiveData> {
        const platform = await this.getOneOrThrow(id)
        const [samlConfigured, usage, plan, billingEnforced] = await Promise.all([
            this.hasSamlConfigured(id),
            getUsage(log, platform),
            getPlan(log, platform),
            getBillingEnforced(log, id),
        ])
        return {
            ...platform,
            federatedAuthProviders: { saml: samlConfigured ? {} : null },
            usage,
            billingEnforced,
            plan,
        }
    },
})

// A never-rotated identity carries no version at all, so two absent values are
// the same version, not two unknowns.
function isSameTokenVersion(current: string | undefined, caller: string | undefined): boolean {
    if (isNil(current) && isNil(caller)) {
        return true
    }
    return current === caller
}

function personalProjectName(platformName: string): string {
    return /['’]s$/.test(platformName) ? `${platformName} Project` : `${platformName}'s Project`
}

async function finishExistingPlatform({ user, platformId, name, invalidatePreviousTokens, identityId, log }: FinishExistingPlatformParams): Promise<AuthenticationResponse> {
    const hasProjects = await projectService(log).userHasProjects({
        platformId,
        userId: user.id,
        isPrivileged: userService(log).isUserPrivileged(user),
    })
    const project = hasProjects
        ? null
        : await projectService(log).create({
            displayName: personalProjectName(name),
            ownerId: user.id,
            platformId,
            type: ProjectType.PERSONAL,
        })
    if (invalidatePreviousTokens) {
        await userIdentityRepository().update(identityId, {
            tokenVersion: nanoid(),
        })
    }
    return authenticationUtils(log).getProjectAndToken({
        userId: user.id,
        platformId,
        projectId: project?.id ?? null,
    })
}

async function getUsage(log: FastifyBaseLogger, platform: PlatformWithoutFederatedAuth): Promise<PlatformUsage | undefined> {
    const edition = system.getEdition()
    if (edition === ApEdition.COMMUNITY) {
        return undefined
    }
    return platformPlanService(log).getUsage(platform.id)
}

async function getBillingEnforced(log: FastifyBaseLogger, platformId: PlatformId): Promise<boolean | undefined> {
    if (system.getEdition() === ApEdition.COMMUNITY) {
        return undefined
    }
    const { data, error } = await tryCatch(() => billingProvider.get(log).isBillingEnforced(platformId))
    if (!isNil(error)) {
        log.warn({ error, platform: { id: platformId } }, 'Failed to resolve billing enforcement for the platform payload')
        return undefined
    }
    return data ?? undefined
}

async function getPlan(log: FastifyBaseLogger, platform: PlatformWithoutFederatedAuth): Promise<PlatformPlanLimits> {
    const edition = system.getEdition()
    if (edition === ApEdition.COMMUNITY) {
        return {
            ...OPEN_SOURCE_PLAN,
        }
    }
    return platformPlanService(log).getOrCreateForPlatform(platform.id)
}

function stripFederatedAuth(platform: Platform): PlatformWithoutFederatedAuth {
    const { federatedAuthProviders: _omitted, ...rest } = platform
    return rest
}

function hasFederatedAuth(platform: Platform | PlatformWithoutFederatedAuth): platform is Platform {
    return 'federatedAuthProviders' in platform
}

type AddParams = {
    ownerId: UserId
    name: string
    primaryColor?: string
    logoIconUrl?: string
    fullLogoUrl?: string
    favIconUrl?: string
}

type NewPlatform = Omit<Platform, 'created' | 'updated'>

type UpdateParams = UpdatePlatformRequestBody & {
    id: PlatformId
    plan?: Partial<PlatformPlanLimits>
    logoIconUrl?: string
    fullLogoUrl?: string
    favIconUrl?: string
    ssoDomain?: string | null
    ssoDomainVerification?: SsoDomainVerification | null
}

type CreatePlatformWithProjectResult = {
    response: AuthenticationResponse
    provisioned: boolean
}

type CreatePlatformWithProjectParams = {
    identityId: string
    name: string
    invalidatePreviousTokens: boolean
    isFirstPlatform: boolean
    callerTokenVersion: string | undefined
    // Runs inside the provisioning lock and only when this call is the one
    // provisioning, so whatever it writes is serialised with account creation
    // and cannot be lost by an interruption after the account exists.
    beforeProvision?: () => Promise<void>
}

type FinishExistingPlatformParams = {
    user: User
    platformId: PlatformId
    name: string
    invalidatePreviousTokens: boolean
    identityId: string
    log: FastifyBaseLogger
}

type ListPlatformsForIdentityParams = {
    identityId: string
}
