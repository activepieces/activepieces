import { databaseConnection } from '../../database/database-connection'
import { FlowVersionEntity } from './flow-version-entity'

export const flowVersionRepo = databaseConnection.getRepository(FlowVersionEntity)
