import { Platform, Tag } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    BaseColumnSchemaPart,
} from '../../database/database-common'

export type TagEntitySchema = Tag & {
    platform: Platform
}
export const TagEntity = new EntitySchema<TagEntitySchema>({
    name: 'tag',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            type: String,
        },
        name: {
            type: String,
        },
    },    
    uniques: [
        {
            columns: ['platformId', 'name'],
        },
    ],
    relations: {
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
