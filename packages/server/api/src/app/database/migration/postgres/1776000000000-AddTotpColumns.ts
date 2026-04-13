import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddTotpColumns1776000000000 implements Migration {
    name = 'AddTotpColumns1776000000000'
    breaking = false
    release = '0.81.3'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "user_identity" ADD "totpSecret" character varying NULL')
        await queryRunner.query('ALTER TABLE "user_identity" ADD "totpEnabled" boolean NOT NULL DEFAULT false')
        await queryRunner.query('ALTER TABLE "user_identity" ADD "backupCodes" jsonb NULL')
        await queryRunner.query('ALTER TABLE "platform" ADD "enforceTotp" boolean NOT NULL DEFAULT false')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform" DROP COLUMN "enforceTotp"')
        await queryRunner.query('ALTER TABLE "user_identity" DROP COLUMN "backupCodes"')
        await queryRunner.query('ALTER TABLE "user_identity" DROP COLUMN "totpEnabled"')
        await queryRunner.query('ALTER TABLE "user_identity" DROP COLUMN "totpSecret"')
    }
}
