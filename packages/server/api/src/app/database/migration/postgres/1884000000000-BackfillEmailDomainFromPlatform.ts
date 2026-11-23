import { apId } from '@activepieces/core-utils'
import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class BackfillEmailDomainFromPlatform1884000000000 implements Migration {
    name = 'BackfillEmailDomainFromPlatform1884000000000'
    breaking = false
    release = '0.94.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        const platforms: PlatformDomainRow[] = await queryRunner.query(`
            SELECT
                "id" AS "platformId",
                lower("ssoDomain") AS "domain",
                COALESCE(("ssoDomainVerification"->>'createdAt')::timestamptz, now()) AS "created",
                "ssoDomainVerification"->>'status' AS "verificationStatus",
                "ssoDomainVerification"->'record'->>'value' AS "verificationRecordValue"
            FROM "platform"
            WHERE "ssoDomain" IS NOT NULL
              AND "ssoDomainVerification" IS NOT NULL
        `)
        if (platforms.length === 0) {
            return
        }
        const placeholders = platforms.map((_, index) => {
            const offset = index * 6
            return `($${offset + 1}, $${offset + 2}, now(), $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`
        })
        const params = platforms.flatMap((platform) => [apId(), platform.created, platform.platformId, platform.domain, platform.verificationStatus, platform.verificationRecordValue])
        await queryRunner.query(`
            INSERT INTO "email_domain" ("id", "created", "updated", "platformId", "domain", "verificationStatus", "verificationRecordValue")
            VALUES ${placeholders.join(', ')}
            ON CONFLICT DO NOTHING
        `, params)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DELETE FROM "email_domain"')
    }
}

type PlatformDomainRow = {
    platformId: string
    domain: string
    created: Date
    verificationStatus: string
    verificationRecordValue: string | null
}
