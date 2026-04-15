import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddTwoFactor1776600000000 implements Migration {
    name = 'AddTwoFactor1776600000000'
    breaking = false
    transaction = false
    release = '0.81.3'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "user_identity" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT FALSE')

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "twoFactor" (
                "id" TEXT PRIMARY KEY,
                "secret" TEXT NOT NULL,
                "backupCodes" TEXT NOT NULL,
                "userId" TEXT NOT NULL REFERENCES "user_identity"("id") ON DELETE CASCADE,
                "verified" BOOLEAN NOT NULL DEFAULT FALSE,
                "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `)
        await queryRunner.query('CREATE INDEX IF NOT EXISTS "twoFactor_userId_idx" ON "twoFactor" ("userId")')

        await queryRunner.query('ALTER TABLE "platform" ADD COLUMN IF NOT EXISTS "enforceTotp" BOOLEAN NOT NULL DEFAULT FALSE')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform" DROP COLUMN IF EXISTS "enforceTotp"')
        await queryRunner.query('DROP INDEX IF EXISTS "twoFactor_userId_idx"')
        await queryRunner.query('DROP TABLE IF EXISTS "twoFactor"')
        await queryRunner.query('ALTER TABLE "user_identity" DROP COLUMN IF EXISTS "twoFactorEnabled"')
    }
}
