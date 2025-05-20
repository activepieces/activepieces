import {
    ActivepiecesError,
    apId,
    ErrorCode,
    FilteredPieceBehavior,
    isNil,
    LocalesEnum,
    Platform,
    PlatformId,
    PlatformPlanWithoutEntityData,
    PlatformWithoutSensitiveData,
    spreadIfDefined,
    UpdatePlatformRequestBody,
    UserId,
} from '@activepieces/shared'
import { In } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { defaultTheme } from '../flags/theme'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
import { PlatformEntity } from './platform.entity'
import { platformBillingService } from '../ee/platform/platform-plan/platform-plan.service'
import { system } from '../helper/system/system'

const repo = repoFactory<Platform>(PlatformEntity)
const OPENSOURCE_PLAN: PlatformPlanWithoutEntityData = {
    embeddingEnabled: false,
    globalConnectionsEnabled: false,
    customRolesEnabled: false,
    includedTasks: 0,
    includedAiCredits: 0,
    environmentsEnabled: false,
    analyticsEnabled: false,
    showPoweredBy: false,
    auditLogEnabled: false,
    managePiecesEnabled: false,
    manageTemplatesEnabled: false,
    customAppearanceEnabled: false,
    manageProjectsEnabled: false,
    projectRolesEnabled: false,
    customDomainsEnabled: false,
    apiKeysEnabled: false,
    alertsEnabled: false,
    ssoEnabled: false,
    stripeCustomerId: undefined,
    stripeSubscriptionId: undefined,
    stripeSubscriptionStatus: undefined,
}

export const platformService = {
    async hasAnyPlatforms(): Promise<boolean> {
        const count = await repo().count()
        return count > 0
    },
    async listPlatformsForIdentityWithAtleastProject(params: ListPlatformsForIdentityParams): Promise<PlatformWithoutSensitiveData[]> {
        const users = await userService.getByIdentityId({ identityId: params.identityId })

        const platformsWithProjects = await Promise.all(users.map(async (user) => {
            if (isNil(user.platformId)) {
                return null
            }
            const hasProjects = await projectService.userHasProjects({
                platformId: user.platformId,
                userId: user.id,
            })
            return hasProjects ? user.platformId : null
        }))

        const platformIds = platformsWithProjects.filter((platformId) => !isNil(platformId))

        return repo().find({
            where: {
                id: In(platformIds),
            },
        })
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
            plan: OPENSOURCE_PLAN,
            defaultLocale: LocalesEnum.ENGLISH,
            emailAuthEnabled: true,
            filteredPieceNames: [],
            enforceAllowedAuthDomains: false,
            allowedAuthDomains: [],
            filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
            federatedAuthProviders: {},
            cloudAuthEnabled: true,
            pinnedPieces: [],
        }

        const savedPlatform = await repo().save(newPlatform)

        await userService.addOwnerToPlatform({
            id: ownerId,
            platformId: savedPlatform.id,
        })

        return savedPlatform
    },

    async getAll(): Promise<Platform[]> {
        return repo().find()
    },
    async getOldestPlatform(): Promise<Platform | null> {
        return repo().findOne({
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
        const copilotSettings = params.copilotSettings ? {
            ...platform.copilotSettings,
            ...params.copilotSettings,
        } : platform.copilotSettings
        const updatedPlatform: Platform = {
            ...platform,
            copilotSettings,
            federatedAuthProviders,
            ...spreadIfDefined('name', params.name),
            ...spreadIfDefined('primaryColor', params.primaryColor),
            ...spreadIfDefined('logoIconUrl', params.logoIconUrl),
            ...spreadIfDefined('fullLogoUrl', params.fullLogoUrl),
            ...spreadIfDefined('favIconUrl', params.favIconUrl),
            ...spreadIfDefined('filteredPieceNames', params.filteredPieceNames),
            ...spreadIfDefined('filteredPieceBehavior', params.filteredPieceBehavior),
            ...spreadIfDefined('cloudAuthEnabled', params.cloudAuthEnabled),
            ...spreadIfDefined('defaultLocale', params.defaultLocale),
            ...spreadIfDefined(
                'enforceAllowedAuthDomains',
                params.enforceAllowedAuthDomains,
            ),
            ...spreadIfDefined('allowedAuthDomains', params.allowedAuthDomains),
            ...spreadIfDefined('pinnedPieces', params.pinnedPieces),
            smtp: params.smtp,
        }
        if(!isNil(params.plan)) {
            await platformBillingService(system.globalLogger()).update({
                platformId: params.id,
                ...params.plan,
            })
        }
        return repo().save(updatedPlatform)
    },

    async getOneOrThrow(id: PlatformId): Promise<Platform> {
        const platform = await repo().findOneBy({
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
    async getOne(id: PlatformId): Promise<Platform | null> {
        return repo().findOneBy({
            id,
        })
    },
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
    plan?: Partial<PlatformPlanWithoutEntityData>
}


type ListPlatformsForIdentityParams = {
    identityId: string
}