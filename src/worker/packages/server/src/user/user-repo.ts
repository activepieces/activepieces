import { databaseConnection } from '../database/database-connection';
import { UserEntity } from './user-entity';

export const userRepo = databaseConnection.getRepository(UserEntity);
