import {DataSource} from 'typeorm';

export const DatabaseSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 7432,
    username: 'postgres',
    password: 'A79Vm5D4p2VQHOp2gd5',
    database: 'activepieces',
    synchronize: true,
});
