import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPgLocaleCollation1740031341436 implements MigrationInterface {
    name = 'AddPgLocaleCollation1740031341436'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE COLLATION en_natural (LOCALE = \'en-US-u-kn-true\', PROVIDER = \'icu\')',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP COLLATION en_natural')
    }
}
