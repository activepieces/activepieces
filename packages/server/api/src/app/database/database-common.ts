import { EntitySchemaColumnOptions } from 'typeorm'
import { getEdition } from '../helper/secret-helper'
import { DatabaseType, system, SystemProp } from '@activepieces/server-shared'
import { ApEdition } from '@activepieces/shared'

const databaseType = system.get(SystemProp.DB_TYPE)

export const JSON_COLUMN_TYPE =
  databaseType === DatabaseType.SQLITE3 ? 'simple-json' : 'json'
export const JSONB_COLUMN_TYPE =
  databaseType === DatabaseType.SQLITE3 ? 'simple-json' : 'jsonb'
export const BLOB_COLUMN_TYPE =
  databaseType === DatabaseType.SQLITE3 ? 'blob' : 'bytea'
export const ARRAY_COLUMN_TYPE =
  databaseType === DatabaseType.SQLITE3 ? 'simple-array' : String
export const TIMESTAMP_COLUMN_TYPE =
  databaseType === DatabaseType.SQLITE3
      ? 'datetime'
      : 'timestamp with time zone'
export const COLLATION =
  databaseType === DatabaseType.SQLITE3 ? undefined : 'en_natural'

export function isPostgres(): boolean {
    return databaseType === DatabaseType.POSTGRES
}

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
        type: TIMESTAMP_COLUMN_TYPE,
        createDate: true,
    } as EntitySchemaColumnOptions,
    updated: {
        name: 'updated',
        type: TIMESTAMP_COLUMN_TYPE,
        updateDate: true,
    } as EntitySchemaColumnOptions,
}

export function isNotOneOfTheseEditions(editions: ApEdition[]): boolean {
    return !editions.includes(getEdition())
}