import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFlowVersionToIssue1751927222122 implements MigrationInterface {
    name = 'AddFlowVersionToIssue1751927222122'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "issue"
        `)

        await queryRunner.query(`
            ALTER TABLE "issue"
            ADD "flowVersionId" character varying(21) NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "issue"
            ADD CONSTRAINT "FK_eba4c662c378687bf44f97b3f1f" FOREIGN KEY ("flowVersionId") REFERENCES "flow_version"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "issue" DROP CONSTRAINT "FK_eba4c662c378687bf44f97b3f1f"
        `)
        await queryRunner.query(`
            ALTER TABLE "issue" DROP COLUMN "flowVersionId"
        `)
    }

}
