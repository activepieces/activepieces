import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddExternalIdToAgentId1753641361099 implements MigrationInterface {
    name = 'AddExternalIdToAgentId1753641361099'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ADD "agentIds" character varying array
        `)
        await queryRunner.query(`
            UPDATE "flow_version"
            SET "agentIds" = '{}'
            WHERE "agentIds" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ALTER COLUMN "agentIds" SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "agent"
            ADD "externalId" character varying
        `)
        await queryRunner.query(`
            UPDATE "agent"
            SET "externalId" = "id"
        `)
        await queryRunner.query(`
            ALTER TABLE "agent"
            ALTER COLUMN "externalId" SET NOT NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_agent_projectId_externalId" ON "agent" ("projectId", "externalId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_agent_projectId_externalId"
        `)
        await queryRunner.query(`
            ALTER TABLE "agent" DROP COLUMN "externalId"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_version" DROP COLUMN "agentIds"
        `)
    }

}
