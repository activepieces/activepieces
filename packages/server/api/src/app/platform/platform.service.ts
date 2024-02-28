import {
    ActivepiecesError,
    ErrorCode,
    LocalesEnum,
    UserId,
    apId,
    isNil,
    spreadIfDefined,
} from '@activepieces/shared'
import { databaseConnection } from '../database/database-connection'
import { PlatformEntity } from './platform.entity'
import {
    FilteredPieceBehavior,
    Platform,
    PlatformId,
    UpdatePlatformRequestBody,
} from '@activepieces/shared'
import { defaultTheme } from '../flags/theme'
import { userService } from '../user/user-service'

const repo = databaseConnection.getRepository<Platform>(PlatformEntity)

export const platformService = {
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
            gitSyncEnabled: false,
            showActivityLog: false,
        }

        const savedPlatform = await repo.save(newPlatform)

        await addOwnerToPlatform({
            platformId: newPlatform.id,
            ownerId,
        })


        return savedPlatform
    },

    async getOldestPlatform(): Promise<Platform | null> {
        return repo.findOne({
            where: {},
            order: {
                created: 'ASC',
            },
        })
    },
    async update(params: UpdateParams): Promise<Platform> {
        const platform = await this.getOneOrThrow(params.id)
        assertPlatformOwnedByUser(platform, params.userId)

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
            ...spreadIfDefined('smtpHost', params.smtpHost),
            ...spreadIfDefined('smtpPort', params.smtpPort),
            ...spreadIfDefined(
                'federatedAuthProviders',
                params.federatedAuthProviders,
            ),
            ...spreadIfDefined('smtpUser', params.smtpUser),
            ...spreadIfDefined('smtpPassword', params.smtpPassword),
            ...spreadIfDefined('smtpSenderEmail', params.smtpSenderEmail),
            ...spreadIfDefined('smtpUseSSL', params.smtpUseSSL),
            ...spreadIfDefined('privacyPolicyUrl', params.privacyPolicyUrl),
            ...spreadIfDefined('termsOfServiceUrl', params.termsOfServiceUrl),
            ...spreadIfDefined('cloudAuthEnabled', params.cloudAuthEnabled),
            ...spreadIfDefined('defaultLocale', params.defaultLocale),
            ...spreadIfDefined('showPoweredBy', params.showPoweredBy),
            ...spreadIfDefined('gitSyncEnabled', params.gitSyncEnabled),
            ...spreadIfDefined('embeddingEnabled', params.embeddingEnabled),
            ...spreadIfDefined('ssoEnabled', params.ssoEnabled),
            ...spreadIfDefined('emailAuthEnabled', params.emailAuthEnabled),
            ...spreadIfDefined(
                'enforceAllowedAuthDomains',
                params.enforceAllowedAuthDomains,
            ),
            ...spreadIfDefined('allowedAuthDomains', params.allowedAuthDomains),
        }

        return repo.save(updatedPlatform)
    },

    async getOneOrThrow(id: PlatformId): Promise<Platform> {
        const platform = await repo.findOneBy({
            id,
        })

        assertPlatformExists(platform)
        return platform
    },

    async getOne(id: PlatformId): Promise<Platform | null> {
        return repo.findOneBy({
            id,
        })
    },

    async getOneByOwner({
        ownerId,
    }: GetOneByOwnerParams): Promise<Platform | null> {
        return repo.findOneBy({
            ownerId,
        })
    },

    async checkUserIsOwner({
        platformId,
        userId,
    }: CheckUserIsOwnerParams): Promise<boolean> {
        const platform = await this.getOneOrThrow(platformId)
        return platform.ownerId === userId
    },
}

const assertPlatformExists: (
    platform: Platform | null
) => asserts platform is Platform = (platform) => {
    if (isNil(platform)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                message: 'platform not found',
            },
        })
    }
}

const assertPlatformOwnedByUser = (
    platform: Platform,
    userId: UserId,
): void => {
    if (platform.ownerId !== userId) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {},
        })
    }
}

const addOwnerToPlatform = ({
    platformId,
    ownerId,
}: AddOwnerToPlatformParams): Promise<void> => {
    return userService.updatePlatformId({
        id: ownerId,
        platformId,
    })
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
    userId: UserId
    auditLogEnabled?: boolean
    showPoweredBy?: boolean
    ssoEnabled?: boolean
    gitSyncEnabled?: boolean
    embeddingEnabled?: boolean
}

type GetOneByOwnerParams = {
    ownerId: UserId
}

type CheckUserIsOwnerParams = {
    platformId: PlatformId
    userId: UserId
}

type AddOwnerToPlatformParams = {
    platformId: PlatformId
    ownerId: UserId
}

