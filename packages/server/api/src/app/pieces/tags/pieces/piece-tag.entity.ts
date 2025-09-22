import { PieceTag, Platform, Tag } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../../../database/database-common'

export type PieceTagSchema = PieceTag & {
    tag: Tag
    platform: Platform
}
export const PieceTagEntity = new EntitySchema<PieceTagSchema>({
    name: 'piece_tag',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            type: String,
        },
        pieceName: {
            type: String,
        },
        tagId: {
            type: String,
        },
    },
    uniques: [
        {
            columns: ['tagId', 'pieceName'],
        },
    ],
    indices: [
        {
            name: 'tag_platformId',
            columns: ['platformId'],
        },
    ],
    relations: {
        tag: {
            target: 'tag',
            type: 'many-to-one',
            cascade: true,
            joinColumn: {
                name: 'tagId',
            },
        },
        platform: {
            target: 'platform',
            type: 'many-to-one',
            cascade: true,
            joinColumn: {
                name: 'platformId',
            },
        },
    },
})
