import { FastifyBaseLogger } from 'fastify';
import { billingEmailService } from './billing-email.service';
import { synkraSubscriptionService } from './subscription.service';
import { userService } from '../../user/user-service';

type Tier = 'free' | 'starter' | 'business' | 'pro';
const TIER_PRICE: Record<Tier, number> = { free: 0, starter: 299, business: 599, pro: 999 };

async function emailFor(log: FastifyBaseLogger, userId: string): Promise<string | null> {
  try {
    const user = await userService(log).getOneOrFail({ id: userId });
    return user?.email ?? null;
  } catch {
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

      try {
        const remindable = await svc.findDueReminders(now, 3);
        for (const sub of remindable) {
          const to = await emailFor(log, sub.userId);
          if (!to || !sub.currentPeriodEnd) continue;
          const tier = sub.tier as Tier;
          mail.sendRenewalReminder(to, tier, new Date(sub.currentPeriodEnd), TIER_PRICE[tier]);
          await svc.markReminderSent(sub.userId, new Date(sub.currentPeriodEnd).toISOString());
          stats.reminders++;
        }
      } catch (err) {
        log.error({ err }, 'renewals: reminder pass failed');
      }

      try {
        const due = await svc.findDueRenewals(now);
        for (const sub of due) {
          const meta = (sub.metadata ?? {}) as Record<string, unknown>;
          const sc = meta['scheduledChange'] as { kind: 'downgrade' | 'cancel'; toTier?: string } | undefined;

          if (sc?.kind === 'cancel') {
            await svc.updateTier(sub.userId, {
              tier: 'free', status: 'active', cancelAtPeriodEnd: false,
              currentPeriodStart: null, currentPeriodEnd: null,
              paystackSubscriptionCode: null, paystackPlanCode: null,
            });
            log.info({ userId: sub.userId }, 'renewals: cancel applied to free');
            stats.downgrades++;
            continue;
          }

          if (sc?.kind === 'downgrade' && sc.toTier) {
            await svc.updateTier(sub.userId, {
              tier: sc.toTier, status: 'active', cancelAtPeriodEnd: false,
              currentPeriodStart: now,
              currentPeriodEnd: new Date(now.getTime() + 30 * 86_400_000),
            });
            log.info({ userId: sub.userId, toTier: sc.toTier }, 'renewals: downgrade applied');
            stats.downgrades++;
            continue;
          }

          const nextEnd = new Date(now.getTime() + 30 * 86_400_000);
          await svc.updateTier(sub.userId, {
            status: 'active', currentPeriodStart: now,
            currentPeriodEnd: nextEnd, cancelAtPeriodEnd: false,
          });
          const tier = sub.tier as Tier;
          const to = await emailFor(log, sub.userId);
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
