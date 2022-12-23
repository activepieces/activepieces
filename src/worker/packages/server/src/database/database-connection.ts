import {DataSource} from 'typeorm';
import {UserEntity} from '../user/user-entity';
import {CollectionEntity} from "../collection/collection-entity";
import {ProjectEntity} from "../entity/project-entity";
import {CollectionVersionEntity} from "../collection/collection-version/collection-version";

export const databaseConnection = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 7432,
    username: 'postgres',
    password: 'A79Vm5D4p2VQHOp2gd5',
    database: 'activepieces',
    synchronize: true,
    entities: [UserEntity,
        CollectionEntity,
        ProjectEntity,
        CollectionVersionEntity],
});
