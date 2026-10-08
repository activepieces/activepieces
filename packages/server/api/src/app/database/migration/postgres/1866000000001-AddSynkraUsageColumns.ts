import { QueryRunner } from 'typeorm';
import { Migration } from '../../migration';

export class AddSynkraUsageColumns1866000000001 implements Migration {
  name = 'AddSynkraUsageColumns1866000000001';
  breaking = false;
  release = '0.93.0';
  timestamp = 1866000000001;

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "synkra_subscription" ADD COLUMN IF NOT EXISTS "aiOpsUsed" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "synkra_subscription" ADD COLUMN IF NOT EXISTS "smsUsed" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "synkra_subscription" ADD COLUMN IF NOT EXISTS "whatsappUsed" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "synkra_subscription" ADD COLUMN IF NOT EXISTS "voiceMinutesUsed" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "synkra_subscription" ADD COLUMN IF NOT EXISTS "emailsUsed" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "synkra_subscription" ADD COLUMN IF NOT EXISTS "storageBytesUsed" bigint NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "synkra_subscription" ADD COLUMN IF NOT EXISTS "usagePeriodStart" timestamp with time zone`);
    await queryRunner.query(`ALTER TABLE "synkra_subscription" ADD COLUMN IF NOT EXISTS "usagePeriodEnd" timestamp with time zone`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "synkra_subscription" DROP COLUMN IF EXISTS "aiOpsUsed"`);
    await queryRunner.query(`ALTER TABLE "synkra_subscription" DROP COLUMN IF EXISTS "smsUsed"`);
    await queryRunner.query(`ALTER TABLE "synkra_subscription" DROP COLUMN IF EXISTS "whatsappUsed"`);
    await queryRunner.query(`ALTER TABLE "synkra_subscription" DROP COLUMN IF EXISTS "voiceMinutesUsed"`);
    await queryRunner.query(`ALTER TABLE "synkra_subscription" DROP COLUMN IF EXISTS "emailsUsed"`);
    await queryRunner.query(`ALTER TABLE "synkra_subscription" DROP COLUMN IF EXISTS "storageBytesUsed"`);
    await queryRunner.query(`ALTER TABLE "synkra_subscription" DROP COLUMN IF EXISTS "usagePeriodStart"`);
    await queryRunner.query(`ALTER TABLE "synkra_subscription" DROP COLUMN IF EXISTS "usagePeriodEnd"`);
  }
}
