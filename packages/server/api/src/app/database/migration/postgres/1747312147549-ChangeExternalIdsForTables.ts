import { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeExternalIdsForTables1747312147549 implements MigrationInterface {
    name = 'ChangeExternalIdsForTables1747312147549'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE table SET "externalId" = "id"
        `)
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // No need to do anything
    }

}
