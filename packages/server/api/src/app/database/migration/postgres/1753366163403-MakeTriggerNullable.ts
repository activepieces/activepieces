import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeTriggerNullable1753366163403 implements MigrationInterface {
    name = 'MakeTriggerNullable1753366163403'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "table"
            SET "trigger" = NULL
        `)
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // do nothing
    }

}
