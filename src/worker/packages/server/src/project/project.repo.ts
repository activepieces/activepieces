import { databaseConnection } from '../database/database-connection';
import { ProjectEntity } from '../entity/project-entity';

export const projectRepo = databaseConnection.getRepository(ProjectEntity);
