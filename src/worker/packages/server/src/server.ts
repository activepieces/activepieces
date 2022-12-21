import app from './app/app';
import { createDatabase } from 'typeorm-extension';
import AppDataSource from './database/database.connection';
// Process.env will always be comprised of strings, so we typecast the port to a
// number.
const PORT:number = Number(process.env.PORT) || 3000;

(async () => {
    try {
        await createDatabase({synchronize: true});
        await AppDataSource.initialize();
        console.log('Data Source has been initialized!');
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('Error during Data Source initialization', err);
    }
})();