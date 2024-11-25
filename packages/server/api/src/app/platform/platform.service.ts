import {
    ActivepiecesError,
    apId,
    ErrorCode,
    FilteredPieceBehavior,

    isNil,
    LocalesEnum,
    Platform,
    PlatformId,
    spreadIfDefined,
    UpdatePlatformRequestBody,
    UserId } from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { defaultTheme } from '../flags/theme'
import { userService } from '../user/user-service'
import { PlatformEntity } from './platform.entity'

const repo = repoFactory<Platform>(PlatformEntity)

export const platformService = {
    async hasAnyPlatforms(): Promise<boolean> {
        const count = await repo().count()
        return count > 0
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
            flowIssuesEnabled: false,
            gitSyncEnabled: false,
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
            ...spreadIfDefined('smtp', params.smtp),
            ...spreadIfDefined('analyticsEnabled', params.analyticsEnabled),
            ...spreadIfDefined(
                'federatedAuthProviders',
                params.federatedAuthProviders,
            ),
            ...spreadIfDefined('cloudAuthEnabled', params.cloudAuthEnabled),
            ...spreadIfDefined('defaultLocale', params.defaultLocale),
            ...spreadIfDefined('showPoweredBy', params.showPoweredBy),
            ...spreadIfDefined('gitSyncEnabled', params.gitSyncEnabled),
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
        
        return {
            ...platform,
        }
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
    gitSyncEnabled?: boolean
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
