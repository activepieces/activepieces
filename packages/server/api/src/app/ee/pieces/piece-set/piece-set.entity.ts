import { PieceSet, Platform } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../../database/database-common'

type PieceSetSchema = {
    platform: Platform
} & PieceSet

export const PieceSetEntity = new EntitySchema<PieceSetSchema>({
    name: 'piece_set',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            ...ApIdSchema,
        },
        name: {
            type: String,
        },
        externalId: {
            type: String,
            nullable: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
        generatedForProjectId: {
            ...ApIdSchema,
            nullable: true,
        },
        config: {
            type: 'jsonb',
            default: { pieces: { mode: 'include_all', exceptions: [] }, selectedActions: {}, selectedTriggers: {} },
        },
    },
    indices: [
        {
            name: 'idx_piece_set_platform_id',
            columns: ['platformId'],
            unique: false,
        },
        {
            name: 'idx_piece_set_platform_id_is_default',
            columns: ['platformId'],
            where: '"isDefault" = true',
            unique: true,
        },
        {
            name: 'idx_piece_set_platform_id_external_id',
            columns: ['platformId', 'externalId'],
            where: '"externalId" IS NOT NULL',
            unique: true,
        },
    ],
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                foreignKeyConstraintName: 'fk_piece_set_platform_id',
            },
        },
    },
})
