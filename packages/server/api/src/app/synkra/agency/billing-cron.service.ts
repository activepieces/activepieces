import { FastifyBaseLogger } from 'fastify';
import { repoFactory } from '../../core/db/repo-factory';
import { SynkraAgency, SynkraAgencyEntity } from './agency.entity';
import { SynkraAgencyInvoice, SynkraAgencyInvoiceEntity } from './invoice.entity';
import { synkraAgencyInvoiceService } from './invoice.service';

const agencyRepo = repoFactory<SynkraAgency>(SynkraAgencyEntity);
const invoiceRepo = repoFactory<SynkraAgencyInvoice>(SynkraAgencyInvoiceEntity);

/**
 * Daily agency billing job.
 *
 * Every run:
 *   1. Generates an invoice for any active agency whose invoice period has ended.
 *   2. Sends a daily reminder for invoices that are pending (before due date).
 *   3. Enforces overdue invoices — suspends agency + all clients after grace.
 *
 * All steps are idempotent. Safe to run as often as we want.
 *
 * Wire: called from billing.module.ts on an hourly interval.
 */
export const synkraAgencyBillingCron = (log: FastifyBaseLogger) => ({
  async runOnce(): Promise<{
    invoicesGenerated: number;
    remindersSent: number;
    agenciesPaused: number;
  }> {
    const stats = { invoicesGenerated: 0, remindersSent: 0, agenciesPaused: 0 };
    const now = new Date();

    // ────────────────────────────────────────────────────────
    // 1. Generate invoices for agencies that owe us
    // ────────────────────────────────────────────────────────
    try {
      const activeAgencies = await agencyRepo().find({
        where: { status: 'active' },
      });

      for (const agency of activeAgencies) {
        // The period is the current calendar month.
        // On the 1st of each month, we invoice for the prior month.
        const periodStart = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
        );
        const periodEnd = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
        );

        try {
          const inv = await synkraAgencyInvoiceService(log).generateInvoice({
            agencyId: agency.id,
            periodStart,
            periodEnd,
          });
          if (inv) stats.invoicesGenerated++;
        } catch (err) {
          log.error(
            { err, agencyId: agency.id },
            'agency-billing-cron: invoice generation failed',
          );
        }
      }
    } catch (err) {
      log.error({ err }, 'agency-billing-cron: agency scan failed');
    }

    // ────────────────────────────────────────────────────────
    // 2. Send reminders (max 1 per day per invoice)
    // ────────────────────────────────────────────────────────
    try {
      const pending = await invoiceRepo().find({ where: { status: 'pending' } });
      const ONE_DAY_MS = 86_400_000;

      for (const inv of pending) {
        const lastSent = inv.lastReminderAt ? new Date(inv.lastReminderAt).getTime() : 0;
        if (now.getTime() - lastSent < ONE_DAY_MS) continue;

        try {
          const { billingEmailService } = await import('../billing/billing-email.service');
          const agency = await agencyRepo().findOneBy({ id: inv.agencyId });
          if (!agency) continue;

          const { userService } = await import('../../user/user-service');
          const { userIdentityService } = await import(
            '../../authentication/user-identity/user-identity-service'
          );

          const owner = await userService(log).getOneOrFail({ id: agency.ownerUserId });
          const ident = await userIdentityService(log).getOneOrFail({
            id: owner.identityId,
          });

          // Reuse generic email sender — pass invoice-specific content.
          // (We'll wire a dedicated template in Chunk 4.)
          const daysUntilDue = Math.floor(
            (new Date(inv.dueDate).getTime() - now.getTime()) / 86_400_000,
          );

          billingEmailService(log).sendAgencyReminder({
            to: ident.email,
            invoiceNumber: inv.invoiceNumber,
            amountZar: inv.amountZar,
            dueDate: new Date(inv.dueDate),
            daysUntilDue,
            paymentUrl: inv.paystackPaymentUrl,
          });

          log.info(
            { invoiceId: inv.id, email: ident.email, amountZar: inv.amountZar },
            'agency-billing-cron: reminder sent',
          );

          await synkraAgencyInvoiceService(log).recordReminder(inv.id);
          stats.remindersSent++;
        } catch (err) {
          log.warn({ err, invoiceId: inv.id }, 'agency-billing-cron: reminder failed');
        }
      }
    } catch (err) {
      log.error({ err }, 'agency-billing-cron: reminder pass failed');
    }

    // ────────────────────────────────────────────────────────
    // 3. Enforce overdue — after grace, pause everything
    // ────────────────────────────────────────────────────────
    try {
      const { paused } = await synkraAgencyInvoiceService(log).enforceOverdue();
      stats.agenciesPaused = paused;
    } catch (err) {
      log.error({ err }, 'agency-billing-cron: enforcement failed');
    }

    return stats;
  },
});
