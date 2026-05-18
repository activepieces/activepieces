import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMissingInputUiInfoSqlite1711412511624 implements MigrationInterface {
    name = 'AddMissingInputUiInfoSqlite1711412511624'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        UPDATE flow_version 
        SET trigger = json_set(trigger, '$.settings.inputUiInfo', '{}') 
        WHERE json_extract(trigger, '$.settings.inputUiInfo') IS NULL;
    `)
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // No down migration needed
    }

}
