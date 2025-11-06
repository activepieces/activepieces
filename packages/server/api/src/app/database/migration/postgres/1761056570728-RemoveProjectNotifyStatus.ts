import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveProjectNotifyStatus1761056570728 implements MigrationInterface {
    name = 'RemoveProjectNotifyStatus1761056570728'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "notifyStatus"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "notifyStatus" character varying NOT NULL DEFAULT 'ALWAYS'
        `)
    }

}
