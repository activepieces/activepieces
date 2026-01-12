import {
    ActivepiecesError,
    AiCreditsAutoTopUpState,
    apId,
    ErrorCode,
    FilteredPieceBehavior,
    isNil,
    Platform,
    PlatformId,
    PlatformPlanLimits,
    PlatformUsage,
    PlatformWithoutSensitiveData,
    spreadIfDefined,
    TeamProjectsLimit,
    UpdatePlatformRequestBody,
    UserId,
    UserStatus,
} from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { defaultTheme } from '../flags/theme'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
import { PlatformEntity } from './platform.entity'

// Default open source plan limits (formerly from @activepieces/ee-shared)
const OPEN_SOURCE_PLAN: Omit<PlatformPlanLimits, 'stripeSubscriptionStartDate' | 'stripeSubscriptionEndDate'> = {
    includedAiCredits: 0,
    aiCreditsAutoTopUpState: AiCreditsAutoTopUpState.DISABLED,
    environmentsEnabled: true,
    analyticsEnabled: true,
    showPoweredBy: false,
    agentsEnabled: true,
    mcpsEnabled: true,
    tablesEnabled: true,
    todosEnabled: true,
    auditLogEnabled: false,
    embeddingEnabled: false,
    managePiecesEnabled: true,
    manageTemplatesEnabled: true,
    customAppearanceEnabled: true,
    teamProjectsLimit: TeamProjectsLimit.UNLIMITED,
    projectRolesEnabled: true,
    customDomainsEnabled: false,
    globalConnectionsEnabled: false,
    customRolesEnabled: false,
    apiKeysEnabled: true,
    ssoEnabled: false,
}

export const platformRepo = repoFactory<Platform>(PlatformEntity)

export const platformService = {
    async listPlatformsForIdentityWithAtleastProject(params: ListPlatformsForIdentityParams): Promise<PlatformWithoutSensitiveData[]> {
        const users = await userService.getByIdentityId({ identityId: params.identityId })

        const platformsWithProjects = await Promise.all(users.map(async (user) => {
            if (isNil(user.platformId) || user.status === UserStatus.INACTIVE) {
                return null
            }
            const hasProjects = await projectService.userHasProjects({
                platformId: user.platformId,
                userId: user.id,
                isPrivileged: userService.isUserPrivileged(user),
            })
            return hasProjects ? user.platformId : null
        }))

        const platforms = await Promise.all(platformsWithProjects.filter((platformId) => !isNil(platformId)).map((platformId) => platformService.getOneWithPlanOrThrow(platformId)))
        return platforms
    },
    async create(params: AddParams): Promise<Platform> {
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
            federatedAuthProviders: {},
            cloudAuthEnabled: true,
            pinnedPieces: [],
        }

        const savedPlatform = await platformRepo().save(newPlatform)
        await userService.addOwnerToPlatform({
            id: ownerId,
            platformId: savedPlatform.id,
        })

        return savedPlatform
    },
    async getAll(): Promise<Platform[]> {
        return platformRepo().find()
    },
    async getOldestPlatform(): Promise<Platform | null> {
        return platformRepo().findOne({
            where: {},
            order: {
                created: 'ASC',
            },
        })
    },
    async update(params: UpdateParams): Promise<Platform> {
        const platform = await this.getOneOrThrow(params.id)
        const federatedAuthProviders = {
            ...platform.federatedAuthProviders,
            ...(params.federatedAuthProviders ?? {}),
        }
        const updatedPlatform: Platform = {
            ...platform,
            federatedAuthProviders,
            ...spreadIfDefined('name', params.name),
            ...spreadIfDefined('primaryColor', params.primaryColor),
            ...spreadIfDefined('logoIconUrl', params.logoIconUrl),
            ...spreadIfDefined('fullLogoUrl', params.fullLogoUrl),
            ...spreadIfDefined('favIconUrl', params.favIconUrl),
            ...spreadIfDefined('filteredPieceNames', params.filteredPieceNames),
            ...spreadIfDefined('filteredPieceBehavior', params.filteredPieceBehavior),
            ...spreadIfDefined('cloudAuthEnabled', params.cloudAuthEnabled),
            ...spreadIfDefined('emailAuthEnabled', params.emailAuthEnabled),
            ...spreadIfDefined(
                'enforceAllowedAuthDomains',
                params.enforceAllowedAuthDomains,
            ),
            ...spreadIfDefined('allowedAuthDomains', params.allowedAuthDomains),
            ...spreadIfDefined('pinnedPieces', params.pinnedPieces),
        }
        // Platform plan updates removed (EE feature)
        return platformRepo().save(updatedPlatform)
    },
    async getOneOrThrow(id: PlatformId): Promise<Platform> {
        const platform = await platformRepo().findOneBy({
            id,
        })

        if (isNil(platform)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: id,
                    entityType: 'Platform',
                    message: 'Platform not found',
                },
            })
        }

        return platform
    },
    async getOneWithPlan(id: PlatformId): Promise<PlatformWithoutSensitiveData | null> {
        const platform = await this.getOne(id)
        if (isNil(platform)) {
            return null
        }
        return {
            ...platform,
            usage: await getUsage(platform),
            plan: await getPlan(platform),
        }
    },
    async getOneWithPlanOrThrow(id: PlatformId): Promise<Omit<PlatformWithoutSensitiveData, 'usage'>> {
        const platform = await this.getOneOrThrow(id)
        return {
            ...platform,
            plan: await getPlan(platform),
        }
    },
    async getOneWithPlanAndUsageOrThrow(id: PlatformId): Promise<PlatformWithoutSensitiveData> {
        const platform = await this.getOneOrThrow(id)
        return {
            ...platform,
            usage: await getUsage(platform),
            plan: await getPlan(platform),
        }
    },
    async getOne(id: PlatformId): Promise<Platform | null> {
        return platformRepo().findOneBy({
            id,
        })
    },
}

// Platform usage tracking removed (EE feature)
async function getUsage(_platform: Platform): Promise<PlatformUsage | undefined> {
    return undefined
}

// Platform plan service removed (EE feature) - always return open source defaults
async function getPlan(_platform: Platform): Promise<PlatformPlanLimits> {
    return {
        ...OPEN_SOURCE_PLAN,
        stripeSubscriptionStartDate: 0,
        stripeSubscriptionEndDate: 0,
    }
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
}

type ListPlatformsForIdentityParams = {
    identityId: string
}