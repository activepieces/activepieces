import { ActivepiecesError, ErrorCode, UserId, apId, isNil, spreadIfDefined } from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'
import { PlatformEntity } from './platform.entity'
import { Platform, PlatformId, UpdatePlatformRequestBody } from '@activepieces/ee-shared'
import { defaultTheme } from '../../flags/theme'

const repo = databaseConnection.getRepository<Platform>(PlatformEntity)

export const platformService = {
    async add({ ownerId, name, primaryColor, logoIconUrl, fullLogoUrl, favIconUrl }: AddParams): Promise<Platform> {
        const newPlatform: NewPlatform = {
            id: apId(),
            ownerId,
            name,
            primaryColor: primaryColor ?? defaultTheme.colors.primary.default,
            logoIconUrl: logoIconUrl ?? defaultTheme.logos.logoIconUrl,
            fullLogoUrl: fullLogoUrl ?? defaultTheme.logos.fullLogoUrl,
            favIconUrl: favIconUrl ?? defaultTheme.logos.favIconUrl,
        }

        return await repo.save(newPlatform)
    },

    async update({ id, userId, name, primaryColor, logoIconUrl, fullLogoUrl, favIconUrl }: UpdateParams): Promise<Platform> {
        const platform = await this.getOneOrThrow(id)
        assertPlatformOwnedByUser(platform, userId)

        const updatedPlatform: Platform = {
            ...platform,
            ...spreadIfDefined('name', name),
            ...spreadIfDefined('primaryColor', primaryColor),
            ...spreadIfDefined('logoIconUrl', logoIconUrl),
            ...spreadIfDefined('fullLogoUrl', fullLogoUrl),
            ...spreadIfDefined('favIconUrl', favIconUrl),
        }

        return await repo.save(updatedPlatform)
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

    async getOneByOwner({ ownerId }: GetOneByOwnerParams): Promise<Platform | null> {
        return repo.findOneBy({
            ownerId,
        })
    },

    async checkUserIsOwner({ platformId, userId }: CheckUserIsOwnerParams): Promise<boolean> {
        const platform = await this.getOneOrThrow(platformId)
        return platform.ownerId === userId
    },
}

const assertPlatformExists: (platform: Platform | null) => asserts platform is Platform = (platform) => {
    if (isNil(platform)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                message: 'platform not found',
            },
        })
    }
}

const assertPlatformOwnedByUser = (platform: Platform, userId: UserId): void => {
    if (platform.ownerId !== userId) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {},
        })
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
    userId: UserId
}

type GetOneByOwnerParams = {
    ownerId: UserId
}

type CheckUserIsOwnerParams = {
    platformId: PlatformId
    userId: UserId
}
