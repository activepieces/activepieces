import { DatabaseSource } from '../database/database.connection';
import { UserEntity } from './user-entity';

export const userRepo = DatabaseSource.getRepository(UserEntity);
