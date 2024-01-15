import { Repository, EntityManager, ObjectLiteral, EntitySchema } from 'typeorm'
import { databaseConnection } from '../../database/database-connection'

/**
 * If given an {@link EntityManager}, returns a {@link Repository} for the current transaction.
 * Otherwise, returns the {@link Repository} for the default connection.
 */
type RepoGetter<T extends ObjectLiteral> = (entityManager?: EntityManager) => Repository<T>

/**
 * Creates a {@link RepoGetter} for the given entity.
 * @param entity The entity to create a {@link RepoGetter} for.
 * @returns A {@link RepoGetter} for the given entity.
 */
export const repoFactory = <T extends ObjectLiteral>(entity: EntitySchema<T>): RepoGetter<T> => {
    return (entityManager?: EntityManager) => {
        return entityManager?.getRepository(entity)
        ?? databaseConnection.getRepository(entity)
    }
}
