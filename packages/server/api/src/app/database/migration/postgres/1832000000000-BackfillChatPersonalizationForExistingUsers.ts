import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class BackfillChatPersonalizationForExistingUsers1832000000000 implements Migration {
    name = 'BackfillChatPersonalizationForExistingUsers1832000000000'
    breaking = false
    release = '0.88.2'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "chat_personalization" ("id", "platformId", "userId", "status")
            SELECT
                substr(md5(random()::text || clock_timestamp()::text || "user"."id"), 1, 21),
                "user"."platformId",
                "user"."id",
                'DISMISSED_LEGACY'
            FROM "user"
            INNER JOIN "platform" ON "platform"."id" = "user"."platformId"
            ON CONFLICT DO NOTHING
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "chat_personalization" WHERE "status" = 'DISMISSED_LEGACY'
        `)
    }
}
