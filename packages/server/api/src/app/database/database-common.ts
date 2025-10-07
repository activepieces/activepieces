import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, asserNotEmpty, assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { EntitySchemaColumnOptions, ObjectLiteral, SelectQueryBuilder, Repository } from 'typeorm'
import { DatabaseType, system } from '../helper/system/system'
import { RawSqlResultsToEntityTransformer } from 'typeorm/query-builder/transformer/RawSqlResultsToEntityTransformer'

const databaseType = system.get(AppSystemProp.DB_TYPE)

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
    return !editions.includes(system.getEdition())
}

export const getEntitiesWithMoreSelectedFieldsOrThrow = async <T extends ObjectLiteral>(query: SelectQueryBuilder<T>, ...moreFields: string[]): Promise<T[]> => {
  const { entities, raw } = await query.getRawAndEntities()
  if (isNil(entities) || entities.length === 0) {
    return [] as T[]
  }
  return appendRawFieldsToEntities(entities, raw, ...moreFields)
}

export const getEntitiesWithMoreSelectedFields = async <T extends ObjectLiteral>(query: SelectQueryBuilder<T>, ...moreFields: string[]): Promise<T[]> => {
  try {
    const { entities, raw } = await query.getRawAndEntities()
    if (isNil(entities) || entities.length === 0) {
      return [] as T[]
    }
    return appendRawFieldsToEntities(entities, raw, ...moreFields)
  } catch (error) {
    return [] as T[]
  }
}

const appendRawFieldsToEntities = <T extends ObjectLiteral>(entities: T[], raw: any[], ...moreFields: string[]): T[] => {
  asserNotEmpty(raw, `Raw`)
  const fullEntities: any[] = []
  for (let i = 0; i < entities.length; i++) {
    const extraFields = moreFields.reduce((acc, field) => {
      assertNotNullOrUndefined(raw[i]?.[field], `Raw[${i}].${field}`)
      return { ...acc, [field]: raw[i][field] }
    }, {})
    
    fullEntities[i] = {
      ...entities[i],
      ...extraFields
    }
  }
  return fullEntities as T[]
}
