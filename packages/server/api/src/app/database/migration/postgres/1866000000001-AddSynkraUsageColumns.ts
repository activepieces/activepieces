import { QueryRunner } from 'typeorm';
import { Migration } from '../../migration';

export class AddSynkraUsageColumns1866000000001 implements Migration {
  name = 'AddSynkraUsageColumns1866000000001';
  breaking = false;
  release = '0.93.0';
  timestamp = 1866000000001;

  async up(q: QueryRunner): Promise<void> {
    const cols: [string, string][] = [
      ['aiOpsUsed', 'integer NOT NULL DEFAULT 0'],
      ['smsUsed', 'integer NOT NULL DEFAULT 0'],
      ['whatsappUsed', 'integer NOT NULL DEFAULT 0'],
      ['voiceMinutesUsed', 'integer NOT NULL DEFAULT 0'],
      ['emailsUsed', 'integer NOT NULL DEFAULT 0'],
      ['storageBytesUsed', 'bigint NOT NULL DEFAULT 0'],
      ['usagePeriodStart', 'timestamp with time zone'],
      ['usagePeriodEnd', 'timestamp with time zone'],
    ];
    for (const [c, t] of cols) {
      await q.query(`ALTER TABLE "synkra_subscription" ADD COLUMN IF NOT EXISTS "${c}" ${t}`);
    }
  }

  async down(q: QueryRunner): Promise<void> {
    const cols = [
      'aiOpsUsed', 'smsUsed', 'whatsappUsed', 'voiceMinutesUsed',
      'emailsUsed', 'storageBytesUsed', 'usagePeriodStart', 'usagePeriodEnd',
    ];
    for (const c of cols) {
      await q.query(`ALTER TABLE "synkra_subscription" DROP COLUMN IF EXISTS "${c}"`);
    }
  }
}
