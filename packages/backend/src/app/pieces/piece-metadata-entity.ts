import { EntitySchema } from 'typeorm'
import { PieceMetadata } from '@activepieces/pieces-framework'
import { ApId, BaseModel } from '@activepieces/shared'
import { BaseColumnSchemaPart } from '../helper/base-entity'

export type PieceMetadataSchema = BaseModel<ApId> & PieceMetadata

export const PieceMetadataEntity = new EntitySchema<PieceMetadataSchema>({
    name: 'piece_metadata',
    columns: {
        ...BaseColumnSchemaPart,
        name: {
            type: String,
            nullable: false,
        },
        displayName: {
            type: String,
            nullable: false,
        },
        logoUrl: {
            type: String,
            nullable: false,
        },
        description: {
            type: String,
            nullable: true,
        },
        version: {
            type: String,
            nullable: false,
            collation: 'en_natural',
        },
        minimumSupportedRelease: {
            type: String,
            nullable: false,
            collation: 'en_natural',
        },
        maximumSupportedRelease: {
            type: String,
            nullable: false,
            collation: 'en_natural',
        },
        actions: {
            type: 'jsonb',
            nullable: false,
        },
        triggers: {
            type: 'jsonb',
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_piece_metadata_name_version',
            columns: ['name', 'version'],
            unique: true,
        },
    ],
})
