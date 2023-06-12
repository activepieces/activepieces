import { EntitySchema } from 'typeorm'
import { PieceMetadata } from '@activepieces/pieces-framework'
import { ApId, BaseModel } from '@activepieces/shared'
import { BaseColumnSchemaPart, JSONB_COLUMN_TYPE } from '../helper/base-entity'

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
        },
        minimumSupportedRelease: {
            type: String,
            nullable: false,
        },
        maximumSupportedRelease: {
            type: String,
            nullable: false,
        },
        actions: {
            type: JSONB_COLUMN_TYPE,
            nullable: false,
        },
        triggers: {
            type: JSONB_COLUMN_TYPE,
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
