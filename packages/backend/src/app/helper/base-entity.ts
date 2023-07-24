import { EntitySchemaColumnOptions } from 'typeorm'
import { system } from './system/system'
import { SystemProp } from './system/system-prop'
import { ApEnvironment } from '@activepieces/shared'

export const JSON_COLUMN_TYPE = system.get(SystemProp.ENVIRONMENT) === ApEnvironment.DEVELOPMENT ? 'simple-json' : 'json'
export const JSONB_COLUMN_TYPE = system.get(SystemProp.ENVIRONMENT) === ApEnvironment.DEVELOPMENT ? 'simple-json' : 'jsonb'
export const BLOB_COLUMN_TYPE = system.get(SystemProp.ENVIRONMENT) === ApEnvironment.DEVELOPMENT ? 'blob' : 'bytea'
export const TIMESTAMP_COLUMN_TYPE = system.get(SystemProp.ENVIRONMENT) === ApEnvironment.DEVELOPMENT ? 'datetime' : 'timestamp with time zone'
export const COLLATION = system.get(SystemProp.ENVIRONMENT) === ApEnvironment.DEVELOPMENT ? undefined : 'en_natural'

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
