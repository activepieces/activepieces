import { DataSource } from 'typeorm';
import { CollectionEntity } from '../entity/collection-entity';
import { CollectionVersionEntity } from '../entity/collection-version';
import { ProjectEntity } from '../entity/project-entity';
import { UserEntity } from '../user/user-entity';

export const databaseConnection = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'postgres',
  password: 'mysecretpassword',
  database: 'activepieces',
  synchronize: true,
  entities: [
    UserEntity,
    ProjectEntity,
    CollectionEntity,
    CollectionVersionEntity,
  ],
});
