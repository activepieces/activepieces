import { ApId } from '@activepieces/core-utils'
import { EntitySchema } from 'typeorm'
import { ApIdSchema } from '../../database/database-common'
import { PieceMetadataSchema } from './piece-metadata-entity'

export const PieceTranslationEntity = new EntitySchema<PieceTranslationSchema>({
    name: 'piece_translation',
    columns: {
        pieceMetadataId: {
            ...ApIdSchema,
            primary: true,
            primaryKeyConstraintName: 'pk_piece_translation',
        },
        locale: {
            type: String,
            primary: true,
            primaryKeyConstraintName: 'pk_piece_translation',
        },
        translations: {
            type: 'jsonb',
            nullable: false,
        },
    },
    relations: {
        pieceMetadata: {
            type: 'many-to-one',
            target: 'piece_metadata',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'pieceMetadataId',
                foreignKeyConstraintName: 'fk_piece_translation_piece_metadata_id',
            },
        },
    },
})

export type PieceTranslationSchema = {
    pieceMetadataId: ApId
    locale: string
    translations: Record<string, string>
    pieceMetadata?: Pick<PieceMetadataSchema, 'id'>
}
