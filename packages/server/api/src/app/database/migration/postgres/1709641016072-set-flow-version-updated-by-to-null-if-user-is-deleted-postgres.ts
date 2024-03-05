import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from 'server-shared'

export class SetFlowVersionUpdatedByToNullIfUserIsDeletedPostgres1709641016072 implements MigrationInterface {
    name = 'SetFlowVersionUpdatedByToNullIfUserIsDeletedPostgres1709641016072'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version" DROP CONSTRAINT "fk_updated_by_user_flow"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ADD CONSTRAINT "fk_updated_by_user_flow" FOREIGN KEY ("updatedBy") REFERENCES "user"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION
        `)

        logger.info({ name: this.name }, 'up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version" DROP CONSTRAINT "fk_updated_by_user_flow"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ADD CONSTRAINT "fk_updated_by_user_flow" FOREIGN KEY ("updatedBy") REFERENCES "user"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `)

        logger.info({ name: this.name }, 'down')
    }

}
