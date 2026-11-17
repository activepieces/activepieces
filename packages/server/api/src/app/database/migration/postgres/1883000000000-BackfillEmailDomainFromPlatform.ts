import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class BackfillEmailDomainFromPlatform1883000000000 implements Migration {
    name = 'BackfillEmailDomainFromPlatform1883000000000'
    breaking = false
    release = '0.94.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "email_domain" ("id", "created", "updated", "platformId", "domain", "verificationStatus", "verificationRecordValue")
            SELECT
                substr(md5(random()::text || clock_timestamp()::text || "platform"."id"), 1, 21),
                COALESCE(("platform"."ssoDomainVerification"->>'createdAt')::timestamptz, now()),
                now(),
                "platform"."id",
                lower("platform"."ssoDomain"),
                "platform"."ssoDomainVerification"->>'status',
                "platform"."ssoDomainVerification"->'record'->>'value'
            FROM "platform"
            WHERE "platform"."ssoDomain" IS NOT NULL
              AND "platform"."ssoDomainVerification" IS NOT NULL
            ON CONFLICT DO NOTHING
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DELETE FROM "email_domain"')
    }
}
