import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 52313,
    username: 'postgres',
    password: 'mysecretpassword',
    database: 'test-typescript-example',
    synchronize: true,
});

export default AppDataSource;