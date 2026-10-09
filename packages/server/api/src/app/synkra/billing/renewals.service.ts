import { FastifyBaseLogger } from 'fastify';
import { userIdentityService } from '../../authentication/user-identity/user-identity-service';
import { userService } from '../../user/user-service';
import { billingEmailService } from './billing-email.service';
import { synkraSubscriptionService } from './subscription.service';

type Tier = 'free' | 'starter' | 'business' | 'pro';
const TIER_PRICE: Record<Tier, number> = { free: 0, starter: 299, business: 599, pro: 999 };

async function emailForUser(log: FastifyBaseLogger, userId: string): Promise<string | null> {
  try {
    const user = await userService(log).getOneOrFail({ id: userId });
    if (!user.identityId) return null;
    const identity = await userIdentityService(log).getOneOrFail({ id: user.identityId });
    return identity.email ?? null;
  } catch (err) {
    log.warn({ err, userId }, 'renewals: could not resolve email');
    return null;
  }
}

export const synkraRenewalsService = (log: FastifyBaseLogger) => {
  const svc = synkraSubscriptionService(log);
  const mail = billingEmailService(log);

  return {
    async runOnce(): Promise<{ reminders: number; renewals: number; downgrades: number }> {
      const now = new Date();
      const stats = { reminders: 0, renewals: 0, downgrades: 0 };

      // 1. Renewal reminders, 3 days before
      try {
        const remindable = await svc.findDueReminders(now, 3);
        for (const sub of remindable) {
          if (!sub.currentPeriodEnd) continue;
          const to = await emailForUser(log, sub.userId);
          const tier = sub.tier as Tier;
          if (to) {
            mail.sendRenewalReminder(to, tier, new Date(sub.currentPeriodEnd), TIER_PRICE[tier]);
          }
          await svc.markReminderSent(sub.userId, new Date(sub.currentPeriodEnd).toISOString());
          stats.reminders++;
        }
      } catch (err) {
        log.error({ err }, 'renewals: reminder pass failed');
      }

      // 2. Due renewals, downgrades, cancels
      try {
        const due = await svc.findDueRenewals(now);
        for (const sub of due) {
          const meta = (sub.metadata ?? {}) as Record<string, unknown>;
          const sc = meta['scheduledChange'] as
            | { kind: 'downgrade' | 'cancel'; toTier?: string }
            | undefined;

          if (sc?.kind === 'cancel') {
            await svc.updateTier(sub.userId, {
              tier: 'free',
              status: 'active',
              cancelAtPeriodEnd: false,
              currentPeriodStart: null,
              currentPeriodEnd: null,
              paystackSubscriptionCode: null,
              paystackPlanCode: null,
            });
            log.info({ userId: sub.userId }, 'renewals: cancel applied to free');
            stats.downgrades++;
            continue;
          }

          if (sc?.kind === 'downgrade' && sc.toTier) {
            await svc.updateTier(sub.userId, {
              tier: sc.toTier,
              status: 'active',
              cancelAtPeriodEnd: false,
              currentPeriodStart: now,
              currentPeriodEnd: new Date(now.getTime() + 30 * 86_400_000),
            });
            log.info({ userId: sub.userId, toTier: sc.toTier }, 'renewals: downgrade applied');
            stats.downgrades++;
            continue;
          }

          const nextEnd = new Date(now.getTime() + 30 * 86_400_000);
          await svc.updateTier(sub.userId, {
            tier: sub.tier,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: nextEnd,
            cancelAtPeriodEnd: false,
          });
          const tier = sub.tier as Tier;
          const to = await emailForUser(log, sub.userId);
          if (to) mail.sendRenewalSuccess(to, tier, nextEnd, TIER_PRICE[tier]);
          stats.renewals++;
        }
      } catch (err) {
        log.error({ err }, 'renewals: due pass failed');
      }

      return stats;
    },
  };
};
