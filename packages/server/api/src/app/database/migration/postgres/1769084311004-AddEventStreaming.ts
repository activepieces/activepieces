import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddEventStreaming1769084311004 implements MigrationInterface {
    name = 'AddEventStreaming1769084311004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "event_destination" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "projectId" character varying(21),
                "scope" character varying NOT NULL,
                "events" character varying array NOT NULL,
                "url" character varying NOT NULL,
                CONSTRAINT "PK_e0fe710f7b5b768b59270f7ac05" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_event_destination_platform_scope" ON "event_destination" ("platformId")
            WHERE scope = 'PLATFORM'
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_event_destination_project_scope" ON "event_destination" ("projectId")
            WHERE scope = 'PROJECT'
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "todosEnabled"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "agentsEnabled"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "mcpsEnabled"
        `)
        // Step 1: Add the column with a nullable constraint temporarily
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "eventStreamingEnabled" boolean
        `)
        // Step 2: Set all current rows to false
        await queryRunner.query(`
            UPDATE "platform_plan"
            SET "eventStreamingEnabled" = false
        `)
        // Step 3: Alter the column to not null
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "eventStreamingEnabled" SET NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "event_destination"
            ADD CONSTRAINT "fk_event_destination_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "event_destination"
            ADD CONSTRAINT "fk_event_destination_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "event_destination" DROP CONSTRAINT "fk_event_destination_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "event_destination" DROP CONSTRAINT "fk_event_destination_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "eventStreamingEnabled"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "mcpsEnabled" boolean NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "agentsEnabled" boolean NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "todosEnabled" boolean NOT NULL
        `)
        await queryRunner.query(`
            DROP INDEX "idx_event_destination_project_scope"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_event_destination_platform_scope"
        `)
        await queryRunner.query(`
            DROP TABLE "event_destination"
        `)
    }

}
