import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveShowActivityLog1716105958530 implements MigrationInterface {
    name = 'RemoveShowActivityLog1716105958530'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE platform
            DROP COLUMN "showActivityLog";
        `)
    }
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE platform
            ADD COLUMN "showActivityLog" BOOLEAN;
        `)

        await queryRunner.query(`
            UPDATE platform
            SET "showActivityLog" = false;
        `)

        await queryRunner.query(`
            ALTER TABLE platform
            ALTER COLUMN "showActivityLog" SET NOT NULL;
        `)
    }

}
