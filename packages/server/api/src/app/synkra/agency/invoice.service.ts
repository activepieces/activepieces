import { ActivepiecesError, apId, ErrorCode, isNil } from '@activepieces/core-utils';
import { FastifyBaseLogger } from 'fastify';
import { repoFactory } from '../../core/db/repo-factory';
import { AGENCY_TIERS, AgencyTier } from './agency.service';
import { SynkraAgency, SynkraAgencyEntity } from './agency.entity';
import { SynkraAgencyClient, SynkraAgencyClientEntity } from './agency-client.entity';
import { SynkraAgencyInvoice, SynkraAgencyInvoiceEntity } from './invoice.entity';

const agencyRepo = repoFactory<SynkraAgency>(SynkraAgencyEntity);
const clientRepo = repoFactory<SynkraAgencyClient>(SynkraAgencyClientEntity);
const invoiceRepo = repoFactory<SynkraAgencyInvoice>(SynkraAgencyInvoiceEntity);

const GRACE_PERIOD_DAYS = 7;

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function generateInvoiceNumber(agencyId: string, date: Date): string {
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const suffix = agencyId.slice(-6);
  return `INV-${y}${m}-${suffix}-${Date.now().toString(36).toUpperCase()}`;
}

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitZar: number;
  totalZar: number;
};

export const synkraAgencyInvoiceService = (log: FastifyBaseLogger) => ({
  /**
   * Generate the current month's invoice for an agency.
   * Idempotent per period: skips if an invoice already exists for the period.
   */
  async generateInvoice(params: {
    agencyId: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<SynkraAgencyInvoice | null> {
    const agency = await agencyRepo().findOneBy({ id: params.agencyId });
    if (isNil(agency)) return null;

    // Skip if not active.
    if (agency.status !== 'active') {
      log.info({ agencyId: agency.id, status: agency.status }, 'invoice: skipped — agency not active');
      return null;
    }

    // Skip if invoice for this period already exists.
    const existing = await invoiceRepo()
      .createQueryBuilder('i')
      .where('i."agencyId" = :agencyId', { agencyId: agency.id })
      .andWhere('i."periodStart" = :periodStart', { periodStart: params.periodStart })
      .getOne();
    if (!isNil(existing)) {
      log.info({ agencyId: agency.id }, 'invoice: already exists for this period');
      return existing;
    }

    const tierCfg = AGENCY_TIERS[agency.tier as AgencyTier];

    // Line items: agency fee first.
    const lineItems: InvoiceLineItem[] = [
      {
        description: `${tierCfg.name} monthly fee`,
        quantity: 1,
        unitZar: tierCfg.feeZar,
        totalZar: tierCfg.feeZar,
      },
    ];

    // Then each active client at wholesale.
    const activeClients = await clientRepo().find({
      where: { agencyId: agency.id, status: 'active' },
    });
    for (const c of activeClients) {
      lineItems.push({
        description: `Client: ${c.name} (${c.clientTier})`,
        quantity: 1,
        unitZar: c.wholesaleMonthlyZar,
        totalZar: c.wholesaleMonthlyZar,
      });
    }

    const wholesaleTotal = activeClients.reduce((s, c) => s + c.wholesaleMonthlyZar, 0);
    const total = tierCfg.feeZar + wholesaleTotal;

    if (total <= 0) {
      log.info({ agencyId: agency.id }, 'invoice: total is 0, skipping');
      return null;
    }

    const now = new Date();
    const dueDate = new Date(now.getTime() + GRACE_PERIOD_DAYS * 86_400_000);

    // Create Paystack payment link.
    let paymentUrl: string | null = null;
    let reference: string | null = null;
    try {
      const { paystackClient } = await import('../billing/paystack-client');
      const owner = await import('../../user/user-service');
      const ownerUser = await owner.userService(log).getOneOrFail({ id: agency.ownerUserId });
      const identity = await import('../../authentication/user-identity/user-identity-service');
      const ident = await identity.userIdentityService(log).getOneOrFail({
        id: ownerUser.identityId,
      });

      const ref = `agency-${agency.id.slice(-8)}-${Date.now()}`;
      const tx = await paystackClient.initializeTransaction({
        email: ident.email,
        amountKobo: total * 100,
        callbackUrl: 'https://flow.synkra.co.za/agency?paid=1',
        metadata: {
          agencyId: agency.id,
          invoiceType: 'agency_monthly',
        },
      });
      paymentUrl = tx.authorization_url;
      reference = ref;
      log.info({ agencyId: agency.id, total }, 'invoice: payment link created');
    } catch (err) {
      log.warn({ err, agencyId: agency.id }, 'invoice: paystack link failed — invoice created without link');
    }

    const invoice = await invoiceRepo().save({
      id: apId(),
      agencyId: agency.id,
      invoiceNumber: generateInvoiceNumber(agency.id, now),
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      dueDate,
      amountZar: total,
      agencyFeeZar: tierCfg.feeZar,
      wholesaleTotalZar: wholesaleTotal,
      lineItems,
      status: 'pending',
      paystackReference: reference,
      paystackPaymentUrl: paymentUrl,
      paidAt: null,
      remindersSent: 0,
      lastReminderAt: null,
      pdfUrl: null,
      metadata: {
        activeClientCount: activeClients.length,
        tierName: tierCfg.name,
      },
    });

    // Send the invoice email.
    try {
      const { userService } = await import('../../user/user-service');
      const { userIdentityService } = await import(
        '../../authentication/user-identity/user-identity-service'
      );
      const { billingEmailService } = await import('../billing/billing-email.service');

      const owner = await userService(log).getOneOrFail({ id: agency.ownerUserId });
      const ident = await userIdentityService(log).getOneOrFail({ id: owner.identityId });

      billingEmailService(log).sendAgencyInvoice({
        to: ident.email,
        invoiceNumber: invoice.invoiceNumber,
        amountZar: invoice.amountZar,
        dueDate: invoice.dueDate,
        paymentUrl: invoice.paystackPaymentUrl,
        lineItems: invoice.lineItems,
      });
    } catch (err) {
      log.warn({ err, invoiceId: invoice.id }, 'invoice: email failed');
    }

    log.info({ invoiceId: invoice.id, agencyId: agency.id, total }, 'invoice: generated');
    return invoice;
  },

  async list(agencyId: string, limit = 24): Promise<SynkraAgencyInvoice[]> {
    return invoiceRepo().find({
      where: { agencyId },
      order: { created: 'DESC' },
      take: limit,
    });
  },

  async getById(invoiceId: string): Promise<SynkraAgencyInvoice | null> {
    return invoiceRepo().findOneBy({ id: invoiceId });
  },

  async markPaid(invoiceId: string): Promise<void> {
    await invoiceRepo().update(
      { id: invoiceId },
      { status: 'paid', paidAt: new Date() },
    );
    log.info({ invoiceId }, 'invoice: marked paid');
  },

  async cancel(invoiceId: string): Promise<void> {
    await invoiceRepo().update({ id: invoiceId }, { status: 'cancelled' });
  },

  /**
   * Check which agencies have overdue invoices past the grace period
   * and pause their client environments.
   */
  async enforceOverdue(): Promise<{ paused: number }> {
    const now = new Date();
    const overdue = await invoiceRepo()
      .createQueryBuilder('i')
      .where('i.status = :status', { status: 'pending' })
      .andWhere('i."dueDate" < :now', { now })
      .getMany();

    let paused = 0;
    for (const inv of overdue) {
      try {
        // Mark invoice as overdue.
        await invoiceRepo().update({ id: inv.id }, { status: 'overdue' });

        // Suspend all active clients of this agency.
        await clientRepo().update(
          { agencyId: inv.agencyId, status: 'active' },
          { status: 'suspended' },
        );

        // Suspend the agency itself.
        await agencyRepo().update({ id: inv.agencyId }, { status: 'suspended' });

        paused++;
        log.warn(
          { invoiceId: inv.id, agencyId: inv.agencyId, amountZar: inv.amountZar },
          'invoice: agency suspended for non-payment',
        );

        // Notify the agency.
        try {
          const { userService } = await import('../../user/user-service');
          const { userIdentityService } = await import(
            '../../authentication/user-identity/user-identity-service'
          );
          const { billingEmailService } = await import('../billing/billing-email.service');

          const owner = await userService(log).getOneOrFail({
            id: inv.agencyId === inv.agencyId ? (await agencyRepo().findOneByOrFail({ id: inv.agencyId })).ownerUserId : '',
          });
          const ident = await userIdentityService(log).getOneOrFail({
            id: owner.identityId,
          });

          billingEmailService(log).sendAgencySuspended({
            to: ident.email,
            invoiceNumber: inv.invoiceNumber,
            amountZar: inv.amountZar,
            paymentUrl: inv.paystackPaymentUrl,
          });
        } catch (err) {
          log.warn({ err, invoiceId: inv.id }, 'invoice: suspension email failed');
        }
      } catch (err) {
        log.error({ err, invoiceId: inv.id }, 'invoice: enforcement failed');
      }
    }

    return { paused };
  },

  /**
   * Record reminder sent, increment counter.
   */
  async recordReminder(invoiceId: string): Promise<void> {
    const inv = await invoiceRepo().findOneBy({ id: invoiceId });
    if (isNil(inv)) return;
    await invoiceRepo().update(
      { id: invoiceId },
      {
        remindersSent: (inv.remindersSent ?? 0) + 1,
        lastReminderAt: new Date(),
      },
    );
  },

  async findByPaystackReference(ref: string): Promise<SynkraAgencyInvoice | null> {
    return invoiceRepo().findOneBy({ paystackReference: ref });
  },
});
