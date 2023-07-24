import { EntitySchemaColumnOptions } from 'typeorm'
import { system } from './system/system'
import { SystemProp } from './system/system-prop'


export enum DatabaseType {
    POSTGRES = 'POSTGRES',
    SQLITE3 = 'SQLITE3',
}

export const databaseType =
(system.get(SystemProp.DB_TYPE) as DatabaseType | undefined) ??
DatabaseType.POSTGRES


export const JSON_COLUMN_TYPE =
  databaseType === DatabaseType.SQLITE3 ? 'simple-json' : 'json'
export const JSONB_COLUMN_TYPE =
  databaseType === DatabaseType.SQLITE3 ? 'simple-json' : 'jsonb'
export const BLOB_COLUMN_TYPE =
  databaseType === DatabaseType.SQLITE3 ? 'blob' : 'bytea'
export const TIMESTAMP_COLUMN_TYPE =
  databaseType === DatabaseType.SQLITE3
      ? 'datetime'
      : 'timestamp with time zone'
export const COLLATION =
  databaseType === DatabaseType.SQLITE3 ? undefined : 'en_natural'

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
