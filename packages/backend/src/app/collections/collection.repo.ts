import { databaseConnection } from '../database/database-connection';
import { CollectionEntity } from './collection.entity';

export const collectionRepo = databaseConnection.getRepository(CollectionEntity);
