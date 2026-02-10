import { AppSystemProp, DatabaseType } from '@activepieces/server-shared'
import { ApEdition } from '@activepieces/shared'
import { EntitySchemaColumnOptions } from 'typeorm'
import { system } from '../helper/system/system'

const databaseType = system.get(AppSystemProp.DB_TYPE)

export const COLLATION = databaseType === DatabaseType.PGLITE ? undefined : 'en_natural'

export const ApIdSchema = {
    type: String,
    length: 21,
} as EntitySchemaColumnOptions

export const BaseColumnSchemaPart = {
    id: {
        ...ApIdSchema,
        primary: true,
    } as EntitySchemaColumnOptions,
    created: {
        name: 'created',
        type: 'timestamp with time zone',
        createDate: true,
    } as EntitySchemaColumnOptions,
    updated: {
        name: 'updated',
        type: 'timestamp with time zone',
        updateDate: true,
    } as EntitySchemaColumnOptions,
}

export function isNotOneOfTheseEditions(editions: ApEdition[]): boolean {
    return !editions.includes(system.getEdition())
}