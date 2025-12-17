import { AppSystemProp, DatabaseType } from '@activepieces/server-shared'
import { ApEdition } from '@activepieces/shared'
import { EntityManager, EntitySchemaColumnOptions } from 'typeorm'
import { system } from '../helper/system/system'
import { databaseConnection } from './database-connection'

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

export async function withStatementTimeout<T>(params: {
    timeoutMs: number
    fn: (entityManager: EntityManager) => Promise<T>
}): Promise<T> {
    const { timeoutMs, fn } = params
    return databaseConnection().transaction(async (entityManager) => {
        await entityManager.query(`SET LOCAL statement_timeout = ${timeoutMs}`)
        return fn(entityManager)
    })
}
