import {
    ApEdition,
    apId,
    AuthenticationResponse,
    FilteredPieceBehavior,
    isNil,
    OPEN_SOURCE_PLAN,
    Platform,
    PlatformId,
    PlatformPlanLimits,
    PlatformRole,
    PlatformUsage,
    PlatformWithoutFederatedAuth,
    PlatformWithoutSensitiveData,
    ProjectType,
    spreadIfDefined,
    UpdatePlatformRequestBody,
    UserId,
    UserStatus,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { nanoid } from 'nanoid'
import { authenticationUtils } from '../authentication/authentication-utils'
import { userIdentityRepository } from '../authentication/user-identity/user-identity-service'
import { repoFactory } from '../core/db/repo-factory'
import { invalidateSamlClientCache } from '../ee/authentication/saml-authn/saml-client'
import { platformPlanService } from '../ee/platform/platform-plan/platform-plan.service'
import { defaultTheme } from '../flags/theme'
import { system } from '../helper/system/system'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
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
            filteredPieceNames: [],
            enforceAllowedAuthDomains: false,
            allowedAuthDomains: [],
            filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
            federatedAuthProviders: { saml: null },
            cloudAuthEnabled: true,
            pinnedPieces: [],
            allowedEmbedOrigins: [],
            googleAuthEnabled: true,
        }

        const savedPlatform = await platformRepo().save(newPlatform)
        await userService(log).addOwnerToPlatform({
            id: ownerId,
            platformId: savedPlatform.id,
        })

        log.info({ platformId: savedPlatform.id, ownerId }, 'Platform created')
        return stripFederatedAuth(savedPlatform)
    },
    async createPlatformWithProject({ identityId, name, invalidatePreviousTokens }: CreatePlatformWithProjectParams): Promise<AuthenticationResponse> {
        const newUser = await userService(log).create({
            identityId,
            platformRole: PlatformRole.ADMIN,
            platformId: null,
        })
        const platform = await this.create({ ownerId: newUser.id, name })
        const defaultProject = await projectService(log).create({
            displayName: `${name}'s Project`,
            ownerId: newUser.id,
            platformId: platform.id,
            type: ProjectType.PERSONAL,
        })
        if (invalidatePreviousTokens) {
            await userIdentityRepository().update(identityId, {
                tokenVersion: nanoid(),
            })
        }
        return authenticationUtils(log).getProjectAndToken({
            userId: newUser.id,
            platformId: platform.id,
            projectId: defaultProject.id,
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
            ...spreadIfDefined('logoIconUrl', params.logoIconUrl),
            ...spreadIfDefined('fullLogoUrl', params.fullLogoUrl),
            ...spreadIfDefined('favIconUrl', params.favIconUrl),
            ...spreadIfDefined('filteredPieceNames', params.filteredPieceNames),
            ...spreadIfDefined('filteredPieceBehavior', params.filteredPieceBehavior),
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
            ...spreadIfDefined('pinnedPieces', params.pinnedPieces),
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
        log.info({ platformId: params.id }, 'Platform updated')
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
        const [samlConfigured, usage, plan] = await Promise.all([
            this.hasSamlConfigured(id),
            getUsage(log, platform),
            getPlan(log, platform),
        ])
        return {
            ...platform,
            federatedAuthProviders: { saml: samlConfigured ? {} : null },
            usage,
            plan,
        }
    },
})

async function getUsage(log: FastifyBaseLogger, platform: PlatformWithoutFederatedAuth): Promise<PlatformUsage | undefined> {
    const edition = system.getEdition()
    if (edition === ApEdition.COMMUNITY) {
        return undefined
    }
    return platformPlanService(log).getUsage(platform.id)
}

async function getPlan(log: FastifyBaseLogger, platform: PlatformWithoutFederatedAuth): Promise<PlatformPlanLimits> {
    const edition = system.getEdition()
    if (edition === ApEdition.COMMUNITY) {
        return {
            ...OPEN_SOURCE_PLAN,
            stripeSubscriptionStartDate: 0,
            stripeSubscriptionEndDate: 0,
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
}

type CreatePlatformWithProjectParams = {
    identityId: string
    name: string
    invalidatePreviousTokens: boolean
}

type ListPlatformsForIdentityParams = {
    identityId: string
}
