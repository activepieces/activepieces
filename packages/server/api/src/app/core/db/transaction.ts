import { EntityManager } from 'typeorm'
import { databaseConnection } from '../../database/database-connection'

export const transaction = async <T>(
    operation: (entityManager: EntityManager) => Promise<T>,
): Promise<T> => {
    return databaseConnection.transaction(operation)
}
