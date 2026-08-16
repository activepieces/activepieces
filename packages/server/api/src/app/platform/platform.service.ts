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
                const provisionedOwner = findProvisionedOwner(existingUsers)
                const platformAlreadyProvisioned = !isNil(provisionedOwner)
                if (platformAlreadyProvisioned) {
                    return resumeProvisionedPlatform({ owner: provisionedOwner, identityId, name, invalidatePreviousTokens, callerTokenVersion, log })
                }
                const ownerWithoutPlatform = existingUsers.find((user) => isNil(user.platformId))
                const unlinkedPlatform = isNil(ownerWithoutPlatform) ? null : await platformRepo().findOneBy({ ownerId: ownerWithoutPlatform.id })
                const provisioningStoppedBeforeLinkingTheOwner = !isNil(ownerWithoutPlatform) && !isNil(unlinkedPlatform)
                if (provisioningStoppedBeforeLinkingTheOwner) {
                    await beforeProvision?.()
                    return linkOwnerToPlatform({ ownerId: ownerWithoutPlatform.id, platformId: unlinkedPlatform.id, identityId, name, invalidatePreviousTokens, log })
                }
                await beforeProvision?.()
                const owner = ownerWithoutPlatform
                    ?? await userService(log).create({
                        identityId,
                        platformRole: PlatformRole.ADMIN,
                        platformId: null,
                    })
                const platform = await this.create({ ownerId: owner.id, name })
                const personalProject = await projectService(log).create({
                    displayName: personalProjectName(name),
                    ownerId: owner.id,
                    platformId: platform.id,
                    type: ProjectType.PERSONAL,
                })
                if (invalidatePreviousTokens) {
                    await rotateTokenVersion(identityId)
                }
                await reportSignup({ identityId, user: owner, projectId: personalProject.id, log })
                const response = await authenticationUtils(log).getProjectAndToken({
                    userId: owner.id,
                    platformId: platform.id,
                    projectId: personalProject.id,
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

function findProvisionedOwner(users: User[]): PlatformOwner | undefined {
    return users.find((user): user is PlatformOwner => !isNil(user.platformId))
}

async function resumeProvisionedPlatform({ owner, identityId, name, invalidatePreviousTokens, callerTokenVersion, log }: ResumeProvisionedPlatformParams): Promise<CreatePlatformWithProjectResult> {
    const identity = await userIdentityService(log).getOneOrFail({ id: identityId })
    const earlierAttemptNeverRotated = isSameTokenVersion(identity.tokenVersion, callerTokenVersion)
    const response = await finishExistingPlatform({
        user: owner,
        platformId: owner.platformId,
        name,
        invalidatePreviousTokens: invalidatePreviousTokens && earlierAttemptNeverRotated,
        identityId,
        log,
    })
    return { response, provisioned: false }
}

async function linkOwnerToPlatform({ ownerId, platformId, identityId, name, invalidatePreviousTokens, log }: LinkOwnerToPlatformParams): Promise<CreatePlatformWithProjectResult> {
    await userService(log).addOwnerToPlatform({ id: ownerId, platformId })
    const owner = await userService(log).getOneOrFail({ id: ownerId })
    const response = await finishExistingPlatform({
        user: owner,
        platformId,
        name,
        invalidatePreviousTokens,
        identityId,
        log,
    })
    if (!isNil(response.projectId)) {
        await reportSignup({ identityId, user: owner, projectId: response.projectId, log })
    }
    return { response, provisioned: true }
}

async function reportSignup({ identityId, user, projectId, log }: ReportSignupParams): Promise<void> {
    await authenticationUtils(log).sendTelemetry({
        identity: await userIdentityService(log).getOneOrFail({ id: identityId }),
        user,
        projectId,
    })
}

function isSameTokenVersion(current: string | undefined, caller: string | undefined): boolean {
    const neitherHasBeenRotated = isNil(current) && isNil(caller)
    return neitherHasBeenRotated || current === caller
}

async function rotateTokenVersion(identityId: string): Promise<void> {
    await userIdentityRepository().update(identityId, {
        tokenVersion: nanoid(),
    })
}

function personalProjectName(platformName: string): string {
    const noun = ' Platform'
    if (platformName.endsWith(noun)) {
        return `${platformName.slice(0, -noun.length)} Project`
    }
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
        await rotateTokenVersion(identityId)
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
    beforeProvision?: () => Promise<void>
}

type PlatformOwner = User & {
    platformId: PlatformId
}
type ResumeProvisionedPlatformParams = {
    owner: PlatformOwner
    identityId: string
    name: string
    invalidatePreviousTokens: boolean
    callerTokenVersion: string | undefined
    log: FastifyBaseLogger
}
type LinkOwnerToPlatformParams = {
    ownerId: UserId
    platformId: PlatformId
    identityId: string
    name: string
    invalidatePreviousTokens: boolean
    log: FastifyBaseLogger
}
type FinishExistingPlatformParams = {
    user: User
    platformId: PlatformId
    name: string
    invalidatePreviousTokens: boolean
    identityId: string
    log: FastifyBaseLogger
}
type ReportSignupParams = {
    identityId: string
    user: User
    projectId: string
    log: FastifyBaseLogger
}

type ListPlatformsForIdentityParams = {
    identityId: string
}
