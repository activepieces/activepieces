import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveProjectNotifyStatus1761056855716 implements MigrationInterface {
    name = 'RemoveProjectNotifyStatus1761056855716'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "notifyStatus"
        `)
       
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "notifyStatus" TEXT NOT NULL DEFAULT 'ALWAYS'
        `)
    }

}
