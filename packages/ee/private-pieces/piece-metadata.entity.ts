import { PieceMetadata } from '@activepieces/pieces-framework'
import { EntitySchema } from 'typeorm'

import { ApId } from '@activepieces/shared'
import { ApIdSchema, BaseColumnSchemaPart } from '@backend/helper/base-entity'

export type PieceMetdataSchema = PieceMetadata & {
    tarFileId: ApId
    created: string
}

export const PieceMetadataEntity = new EntitySchema<PieceMetdataSchema>({
    name: 'piece-metadata',
    columns: {
        ...BaseColumnSchemaPart,
        name: {
            type: String,
        },
        displayName: {
            type: String,
        },
        logoUrl: {
            type: String,
        },
        description: {
            type: String,
        },
        actions: {
            type: 'jsonb',
        },
        triggers: {
            type: 'jsonb',
        },
        version: {
            type: String,
        },
        minimumSupportedRelease: {
            type: String,
            nullable: true,
        },
        maximumSupportedRelease: {
            type: String,
            nullable: true,
        },
        projectId: ApIdSchema,
        tarFileId: ApIdSchema,
    },
    indices: [],
})
