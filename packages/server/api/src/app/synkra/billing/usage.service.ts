import { FastifyBaseLogger } from 'fastify';
import { repoFactory } from '../../core/db/repo-factory';
import { SynkraSubscription, SynkraSubscriptionEntity } from './subscription.entity';
import { synkraSubscriptionService } from './subscription.service';

const repo = repoFactory<SynkraSubscription>(SynkraSubscriptionEntity);

export type MeterField =
  | 'aiOpsUsed'
  | 'smsUsed'
  | 'whatsappUsed'
  | 'voiceMinutesUsed'
  | 'emailsUsed'
  | 'storageBytesUsed';

export const synkraUsageService = (log: FastifyBaseLogger) => ({
  async increment(userId: string, field: MeterField, amount = 1): Promise<void> {
    if (amount <= 0) return;
    await synkraSubscriptionService(log).getOrCreateForUser(userId);
    await repo()
      .createQueryBuilder()
      .update()
      .set({ [field]: () => `"${field}" + ${amount}` } as never)
      .where('"userId" = :userId', { userId })
      .execute();
  },

  async incrementMany(
    userId: string,
    deltas: Partial<Record<MeterField, number>>,
  ): Promise<void> {
    const entries = Object.entries(deltas).filter(([, v]) => typeof v === 'number' && v > 0);
    if (entries.length === 0) return;
    await synkraSubscriptionService(log).getOrCreateForUser(userId);
    const setObj: Record<string, () => string> = {};
    for (const [k, v] of entries) {
      setObj[k] = () => `"${k}" + ${v}`;
    }
    await repo()
      .createQueryBuilder()
      .update()
      .set(setObj as never)
      .where('"userId" = :userId', { userId })
      .execute();
  },

  async getUsage(userId: string): Promise<{
    aiOpsUsed: number;
    smsUsed: number;
    whatsappUsed: number;
    voiceMinutesUsed: number;
    emailsUsed: number;
    storageBytesUsed: number;
    usagePeriodStart: string | null;
    usagePeriodEnd: string | null;
  }> {
    const row = await synkraSubscriptionService(log).getOrCreateForUser(userId);
    return {
      aiOpsUsed: Number(row.aiOpsUsed ?? 0),
      smsUsed: Number(row.smsUsed ?? 0),
      whatsappUsed: Number(row.whatsappUsed ?? 0),
      voiceMinutesUsed: Number(row.voiceMinutesUsed ?? 0),
      emailsUsed: Number(row.emailsUsed ?? 0),
      storageBytesUsed: Number(row.storageBytesUsed ?? 0),
      usagePeriodStart: row.usagePeriodStart ? new Date(row.usagePeriodStart).toISOString() : null,
      usagePeriodEnd: row.usagePeriodEnd ? new Date(row.usagePeriodEnd).toISOString() : null,
    };
  },

  async resetMonthly(userId: string): Promise<void> {
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + 1);
    await repo().update(
      { userId },
      {
        aiOpsUsed: 0,
        smsUsed: 0,
        whatsappUsed: 0,
        voiceMinutesUsed: 0,
        emailsUsed: 0,
        usagePeriodStart: now,
        usagePeriodEnd: end,
      },
    );
  },
});
