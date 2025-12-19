import { AppSystemProp, DatabaseType } from '@activepieces/server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const databaseType = system.get(AppSystemProp.DB_TYPE)

export class AddPgLocaleCollation1740031341436 implements MigrationInterface {
    name = 'AddPgLocaleCollation1740031341436'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (databaseType !== DatabaseType.PGLITE) {
            await queryRunner.query(
                'CREATE COLLATION en_natural (LOCALE = \'en-US-u-kn-true\', PROVIDER = \'icu\')',
            )
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (databaseType !== DatabaseType.PGLITE) {
            await queryRunner.query('DROP COLLATION en_natural')
        }
    }
}
