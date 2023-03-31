import { databaseConnection } from '../database/database-connection'
import { InstanceEntity } from './instance.entity'

export const instanceRepo = databaseConnection.getRepository(InstanceEntity)
