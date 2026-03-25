import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddConnectionOwner1730123432651 implements MigrationInterface {
    name = 'AddConnectionOwner1730123432651'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ADD "ownerId" character varying
        `)
        1
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_owner_id" ON "app_connection" ("ownerId")
        `)
        const tableExists = await queryRunner.hasTable('audit_event')
        if (tableExists) {
            await queryRunner.query(`
                WITH latest_events AS (
                    SELECT DISTINCT ON ((data->'connection'->>'id')::text)  
                        (data->'connection'->>'id')::text AS connection_id,
                        "userId",
                        created
                    FROM audit_event
                    WHERE action = 'connection.upserted'
                    AND data->'connection' IS NOT NULL
                    AND data->'connection'->>'id' IS NOT NULL
                    AND "userId" IS NOT NULL
                    AND "userId" IN (SELECT id FROM "user")
                    ORDER BY (data->'connection'->>'id')::text, created DESC
                )
                UPDATE app_connection
                SET "ownerId" = latest_events."userId"
                FROM latest_events
                WHERE app_connection.id = latest_events.connection_id
            `)
        }
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ADD CONSTRAINT "fk_app_connection_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "app_connection" DROP CONSTRAINT "fk_app_connection_owner_id"
        `)
        await queryRunner.query(`
            DROP INDEX ""idx_app_connection_owner_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection" DROP COLUMN "ownerId"
        `)
    }

}
