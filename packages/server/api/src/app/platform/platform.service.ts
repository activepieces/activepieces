import {
    ActivepiecesError,
    apId,
    ErrorCode,
    FilteredPieceBehavior,
    isNil,
    LocalesEnum,
    Platform,
    PlatformId,
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

const repo = repoFactory<Platform>(PlatformEntity)

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
            embeddingEnabled: false,
            globalConnectionsEnabled: false,
            customRolesEnabled: false,
            analyticsEnabled: false,
            defaultLocale: LocalesEnum.ENGLISH,
            emailAuthEnabled: true,
            auditLogEnabled: false,
            filteredPieceNames: [],
            enforceAllowedAuthDomains: false,
            allowedAuthDomains: [],
            filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
            showPoweredBy: false,
            ssoEnabled: false,
            federatedAuthProviders: {},
            cloudAuthEnabled: true,
            flowIssuesEnabled: true,
            environmentsEnabled: false,
            managePiecesEnabled: false,
            manageTemplatesEnabled: false,
            manageProjectsEnabled: false,
            projectRolesEnabled: false,
            customDomainsEnabled: false,
            apiKeysEnabled: false,
            customAppearanceEnabled: false,
            alertsEnabled: false,
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
        const updatedPlatform: Platform = {
            ...platform,
            ...spreadIfDefined('name', params.name),
            ...spreadIfDefined('auditLogEnabled', params.auditLogEnabled),
            ...spreadIfDefined('primaryColor', params.primaryColor),
            ...spreadIfDefined('logoIconUrl', params.logoIconUrl),
            ...spreadIfDefined('fullLogoUrl', params.fullLogoUrl),
            ...spreadIfDefined('favIconUrl', params.favIconUrl),
            ...spreadIfDefined('filteredPieceNames', params.filteredPieceNames),
            ...spreadIfDefined('filteredPieceBehavior', params.filteredPieceBehavior),
            ...spreadIfDefined('analyticsEnabled', params.analyticsEnabled),
            ...spreadIfDefined(
                'federatedAuthProviders',
                params.federatedAuthProviders,
            ),
            ...spreadIfDefined('cloudAuthEnabled', params.cloudAuthEnabled),
            ...spreadIfDefined('defaultLocale', params.defaultLocale),
            ...spreadIfDefined('showPoweredBy', params.showPoweredBy),
            ...spreadIfDefined('environmentsEnabled', params.environmentsEnabled),
            ...spreadIfDefined('embeddingEnabled', params.embeddingEnabled),
            ...spreadIfDefined('globalConnectionsEnabled', params.globalConnectionsEnabled),
            ...spreadIfDefined('customRolesEnabled', params.customRolesEnabled),
            ...spreadIfDefined('ssoEnabled', params.ssoEnabled),
            ...spreadIfDefined('emailAuthEnabled', params.emailAuthEnabled),
            ...spreadIfDefined(
                'enforceAllowedAuthDomains',
                params.enforceAllowedAuthDomains,
            ),
            ...spreadIfDefined('flowIssuesEnabled', params.flowIssuesEnabled),
            ...spreadIfDefined('allowedAuthDomains', params.allowedAuthDomains),
            ...spreadIfDefined('manageProjectsEnabled', params.manageProjectsEnabled),
            ...spreadIfDefined('managePiecesEnabled', params.managePiecesEnabled),
            ...spreadIfDefined('manageTemplatesEnabled', params.manageTemplatesEnabled),
            ...spreadIfDefined('apiKeysEnabled', params.apiKeysEnabled),
            ...spreadIfDefined('projectRolesEnabled', params.projectRolesEnabled),
            ...spreadIfDefined('customDomainsEnabled', params.customDomainsEnabled),
            ...spreadIfDefined('customAppearanceEnabled', params.customAppearanceEnabled),
            ...spreadIfDefined('alertsEnabled', params.alertsEnabled),
            ...spreadIfDefined('licenseKey', params.licenseKey),
            ...spreadIfDefined('pinnedPieces', params.pinnedPieces),
            ...spreadIfDefined('copilotSettings', params.copilotSettings),
            smtp: params.smtp,
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
    auditLogEnabled?: boolean
    showPoweredBy?: boolean
    ssoEnabled?: boolean
    environmentsEnabled?: boolean
    embeddingEnabled?: boolean
    globalConnectionsEnabled?: boolean
    customRolesEnabled?: boolean
    customDomainsEnabled?: boolean
    customAppearanceEnabled?: boolean
    manageProjectsEnabled?: boolean
    flowIssuesEnabled?: boolean
    managePiecesEnabled?: boolean
    manageTemplatesEnabled?: boolean
    apiKeysEnabled?: boolean
    projectRolesEnabled?: boolean
    alertsEnabled?: boolean
    analyticsEnabled?: boolean
    licenseKey?: string
}


type ListPlatformsForIdentityParams = {
    identityId: string
}