import { FilteredPieceBehavior, Platform, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../database/database-common'

type PlatformSchema = Platform & {
    owner: User
}

export const PlatformEntity = new EntitySchema<PlatformSchema>({
    name: 'platform',
    columns: {
        ...BaseColumnSchemaPart,
        ownerId: {
            ...ApIdSchema,
            nullable: false,
        },
        name: {
            type: String,
            nullable: false,
        },
        primaryColor: {
            type: String,
            nullable: false,
        },
        logoIconUrl: {
            type: String,
            nullable: false,
        },
        fullLogoUrl: {
            type: String,
            nullable: false,
        },
        favIconUrl: {
            type: String,
            nullable: false,
        },
        cloudAuthEnabled: {
            type: Boolean,
            nullable: false,
            default: true,
        },
        googleAuthEnabled: {
            type: Boolean,
            nullable: false,
            default: true,
        },
        filteredPieceNames: {
            type: String,
            array: true,
            nullable: false,
        },
        filteredPieceBehavior: {
            type: String,
            enum: FilteredPieceBehavior,
            nullable: false,
        },
        allowedAuthDomains: {
            type: String,
            array: true,
        },
        allowedEmbedOrigins: {
            type: String,
            array: true,
            nullable: false,
        },
        ssoDomain: {
            type: String,
            nullable: true,
        },
        enforceAllowedAuthDomains: {
            type: Boolean,
            nullable: false,
        },
        emailAuthEnabled: {
            type: Boolean,
            nullable: false,
        },
        federatedAuthProviders: {
            type: 'jsonb',
        },
        pinnedPieces: {
            type: String,
            array: true,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_platform_sso_domain',
            columns: ['ssoDomain'],
            unique: true,
            where: '"ssoDomain" IS NOT NULL',
        },
    ],
    relations: {
        owner: {
            type: 'one-to-one',
            target: 'user',
            onDelete: 'RESTRICT',
            onUpdate: 'RESTRICT',
            joinColumn: {
                name: 'ownerId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_platform_user',
            },
        },
    },
})
