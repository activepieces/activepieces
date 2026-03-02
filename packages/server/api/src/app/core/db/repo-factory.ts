import {
    EntityManager,
    EntitySchema,
    ObjectLiteral,
    Repository,
} from 'typeorm'
import { databaseConnection } from '../../database/database-connection'

/**
 * If given an {@link EntityManager}, returns a {@link Repository} for the current transaction.
 * Otherwise, returns the {@link Repository} for the default connection.
 */
type RepoGetter<T extends ObjectLiteral = ObjectLiteral> = (
    entityManager?: EntityManager
) => Repository<T>

const instances = new Map<string, RepoGetter>()

/**
 * Creates a {@link RepoGetter} for the given entity.
 * @param entity The entity to create a {@link RepoGetter} for.
 * @returns A {@link RepoGetter} for the given entity.
 */
export const repoFactory = <T extends ObjectLiteral>(
    entity: EntitySchema<T>,
): RepoGetter<T> => {
    const entityName = entity.options.name
    if (instances.has(entityName)) {
        return instances.get(entityName) as RepoGetter<T>
    }

    const newInstance: RepoGetter<T> = (entityManager?: EntityManager) => {
        return (
            entityManager?.getRepository(entityName) ??
      databaseConnection().getRepository(entityName)
        ) as Repository<T>
    }

    instances.set(entityName, newInstance as RepoGetter)
    return newInstance
}
