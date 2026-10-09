import { apId, isNil } from '@activepieces/core-utils';
import { FastifyBaseLogger } from 'fastify';
import { repoFactory } from '../../core/db/repo-factory';
import { SynkraSubscription, SynkraSubscriptionEntity } from './subscription.entity';

const repo = repoFactory<SynkraSubscription>(SynkraSubscriptionEntity);

export type ScheduledChange =
  | { kind: 'none' }
  | { kind: 'downgrade'; toTier: 'free' | 'starter' | 'business'; effectiveAt: string }
  | { kind: 'cancel'; effectiveAt: string };

export const synkraSubscriptionService = (_log: FastifyBaseLogger) => ({
  async getForUser(userId: string): Promise<SynkraSubscription | null> {
    return repo().findOneBy({ userId });
  },

  async getOrCreateForUser(userId: string): Promise<SynkraSubscription> {
    const existing = await repo().findOneBy({ userId });
    if (!isNil(existing)) return existing;
    return repo().save({
      id: apId(),
      userId,
      tier: 'free',
      status: 'active',
      cancelAtPeriodEnd: false,
      studentVerified: false,
      communityVerified: false,
      metadata: {},
    });
  },

  async updateTier(userId: string, params: {
    tier: string;
    status?: string;
    paystackCustomerCode?: string | null;
    paystackSubscriptionCode?: string | null;
    paystackPlanCode?: string | null;
    currentPeriodStart?: Date | null;
    currentPeriodEnd?: Date | null;
    cancelAtPeriodEnd?: boolean;
  }): Promise<SynkraSubscription> {
    await this.getOrCreateForUser(userId);
    await repo().update({ userId }, params as never);
    return repo().findOneByOrFail({ userId });
  },

  async setVerification(userId: string, params: {
    studentVerified?: boolean;
    communityVerified?: boolean;
  }): Promise<SynkraSubscription> {
    await this.getOrCreateForUser(userId);
    await repo().update({ userId }, params);
    return repo().findOneByOrFail({ userId });
  },

  async findByPaystackSubscriptionCode(code: string): Promise<SynkraSubscription | null> {
    return repo().findOneBy({ paystackSubscriptionCode: code });
  },

  async cancelByPaystackCode(code: string): Promise<void> {
    await repo().update(
      { paystackSubscriptionCode: code },
      { status: 'cancelled', cancelAtPeriodEnd: true } as never,
    );
  },

  async getTierForUser(userId: string): Promise<string> {
    const sub = await repo().findOneBy({ userId });
    return sub?.tier ?? 'free';
  },

  // ---------- v15: plan change scheduling ----------

  async scheduleCancel(userId: string): Promise<SynkraSubscription> {
    const sub = await this.getOrCreateForUser(userId);
    if (sub.tier === 'free') {
      throw new Error('Free plan has no active subscription to cancel.');
    }
    const meta = { ...(sub.metadata ?? {}), scheduledChange: { kind: 'cancel' as const } };
    await repo().update({ userId }, { cancelAtPeriodEnd: true, metadata: meta } as never);
    return repo().findOneByOrFail({ userId });
  },

  async reactivate(userId: string): Promise<SynkraSubscription> {
    const sub = await this.getOrCreateForUser(userId);
    const meta = { ...(sub.metadata ?? {}) } as Record<string, unknown>;
    delete meta['scheduledChange'];
    await repo().update(
      { userId },
      { cancelAtPeriodEnd: false, status: 'active', metadata: meta } as never,
    );
    return repo().findOneByOrFail({ userId });
  },

  async scheduleDowngrade(userId: string, toTier: 'free' | 'starter' | 'business'): Promise<SynkraSubscription> {
    const sub = await this.getOrCreateForUser(userId);
    const order = ['free', 'starter', 'business', 'pro'] as const;
    const currentIdx = order.indexOf(sub.tier as (typeof order)[number]);
    const targetIdx = order.indexOf(toTier);
    if (targetIdx >= currentIdx) {
      throw new Error('Downgrade target must be a lower tier than current.');
    }
    const meta = { ...(sub.metadata ?? {}), scheduledChange: { kind: 'downgrade' as const, toTier } };
    await repo().update(
      { userId },
      { cancelAtPeriodEnd: true, metadata: meta } as never,
    );
    return repo().findOneByOrFail({ userId });
  },

  // ---------- v15: job queries ----------

  async findDueRenewals(now: Date): Promise<SynkraSubscription[]> {
    return repo()
      .createQueryBuilder('s')
      .where('s."currentPeriodEnd" IS NOT NULL')
      .andWhere('s."currentPeriodEnd" <= :now', { now })
      .andWhere("s.status IN ('active', 'past_due')")
      .andWhere("s.tier != 'free'")
      .getMany();
  },

  async findDueReminders(now: Date, windowDays: number): Promise<SynkraSubscription[]> {
    const horizon = new Date(now.getTime() + windowDays * 86_400_000);
    const rows = await repo()
      .createQueryBuilder('s')
      .where('s."currentPeriodEnd" IS NOT NULL')
      .andWhere('s."currentPeriodEnd" > :now', { now })
      .andWhere('s."currentPeriodEnd" <= :horizon', { horizon })
      .andWhere("s.status = 'active'")
      .andWhere("s.tier != 'free'")
      .andWhere('s."cancelAtPeriodEnd" = false')
      .getMany();
    return rows.filter((r) => {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      const lastSentFor = meta['renewalReminderSentFor'] as string | undefined;
      const dueFor = r.currentPeriodEnd ? new Date(r.currentPeriodEnd).toISOString() : '';
      return lastSentFor !== dueFor;
    });
  },

  async markReminderSent(userId: string, isoPeriodEnd: string): Promise<void> {
    const sub = await this.getOrCreateForUser(userId);
    const meta = { ...(sub.metadata ?? {}), renewalReminderSentFor: isoPeriodEnd };
    await repo().update({ userId }, { metadata: meta } as never);
  },

  async markRetryAttempt(userId: string, attempt: number, lastError: string): Promise<void> {
    const sub = await this.getOrCreateForUser(userId);
    const meta = { ...(sub.metadata ?? {}), retryAttempt: attempt, lastError };
    await repo().update({ userId }, { metadata: meta } as never);
  },

  async markRestricted(userId: string): Promise<void> {
    await repo().update({ userId }, { status: 'restricted' } as never);
  },

  async markPastDue(userId: string): Promise<void> {
    await repo().update({ userId }, { status: 'past_due' } as never);
  },
});
