import { databaseConnection } from '../../src/app/database/database-connection'

export const db = {
    save<T extends Record<string, unknown>>(entity: string, data: T | T[]): Promise<T> {
        const items = Array.isArray(data) ? data : [data]
        return databaseConnection().getRepository(entity).save(items) as Promise<T>
    },

    update(entity: string, id: string, data: Record<string, unknown>): Promise<unknown> {
        return databaseConnection().getRepository(entity).update(id, data)
    },

    findOneByOrFail<T>(entity: string, where: Record<string, unknown>): Promise<T> {
        return databaseConnection().getRepository(entity).findOneByOrFail(where) as Promise<T>
    },

    findOneBy<T>(entity: string, where: Record<string, unknown>): Promise<T | null> {
        return databaseConnection().getRepository(entity).findOneBy(where) as Promise<T | null>
    },
}
