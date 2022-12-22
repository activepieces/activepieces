import { DataSource } from 'typeorm';
import { UserEntity } from '../user/user-entity';

export const databaseConnection = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 7432,
    username: 'postgres',
    password: 'A79Vm5D4p2VQHOp2gd5',
    database: 'activepieces',
    synchronize: true,
    entities: [UserEntity],
});
