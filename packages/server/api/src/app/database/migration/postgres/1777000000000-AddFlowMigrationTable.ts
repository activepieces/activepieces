import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddFlowMigrationTable1777000000000 implements Migration {
    name = 'AddFlowMigrationTable1777000000000'
    breaking = false
    release = '0.81.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "flow_migration" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "userId" character varying(21) NOT NULL,
                "type" character varying NOT NULL,
                "status" character varying NOT NULL,
                "migratedVersions" jsonb NOT NULL,
                "failedFlowVersions" jsonb NOT NULL,
                "params" jsonb NOT NULL,
                CONSTRAINT "pk_flow_migration" PRIMARY KEY ("id"),
                CONSTRAINT "fk_flow_migration_platform" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_migration_platform_id" ON "flow_migration" ("platformId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX "idx_flow_migration_platform_id"')
        await queryRunner.query('DROP TABLE "flow_migration"')
    }
}
