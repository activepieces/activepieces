import { Repository, EntityManager, ObjectLiteral, EntitySchema } from 'typeorm'
import { databaseConnection } from '../../database/database-connection'

type Repo<T extends ObjectLiteral> = (entityManager?: EntityManager) => Repository<T>

export const repoFactory = <T extends ObjectLiteral>(entity: EntitySchema<T>): Repo<T> => {
    return (entityManager?: EntityManager) => {
        return entityManager?.getRepository(entity)
        ?? databaseConnection.getRepository(entity)
    }
}
