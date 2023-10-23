import { ActivepiecesError, ApEdition, ErrorCode, UserId, apId, isNil, spreadIfDefined } from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'
import { PlatformEntity } from './platform.entity'
import { Platform, PlatformId, UpdatePlatformRequestBody } from '@activepieces/ee-shared'
import { getEdition } from '../../helper/secret-helper'

const repo = databaseConnection.getRepository<Platform>(PlatformEntity)

const PRIMARY_COLOR_DEFAULT = '#000000'
const LOGO_ICON_URL_DEFAULT = 'https://activepieces.com/assets/images/logo-icon.png'
const FULL_LOGO_URL_DEFAULT = 'https://activepieces.com/assets/images/logo-full.png'
const FAV_ICON_URL_DEFAULT = 'https://activepieces.com/assets/images/favicon.png'

export const platformService = {
    async add({ ownerId, name, primaryColor, logoIconUrl, fullLogoUrl, favIconUrl }: AddParams): Promise<Platform> {
        const newPlatform: NewPlatform = {
            id: apId(),
            ownerId,
            name,
            primaryColor: primaryColor ?? PRIMARY_COLOR_DEFAULT,
            logoIconUrl: logoIconUrl ?? LOGO_ICON_URL_DEFAULT,
            fullLogoUrl: fullLogoUrl ?? FULL_LOGO_URL_DEFAULT,
            favIconUrl: favIconUrl ?? FAV_ICON_URL_DEFAULT,
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
    async getPlatformIdByOwner({ ownerId }: { ownerId: string }): Promise<string  | undefined> {
        const edition = getEdition()
        if (edition === ApEdition.COMMUNITY) {
            return undefined
        }
        const platform = await repo.findOneBy({
            ownerId,
        })
        return platform?.id
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
