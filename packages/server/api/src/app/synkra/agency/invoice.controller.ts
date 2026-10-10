import { ALL_PRINCIPAL_TYPES, PrincipalType } from '@activepieces/shared';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { securityAccess } from '../../core/security/authorization/fastify-security';
import { synkraAgencyService } from './agency.service';
import { synkraAgencyInvoiceService } from './invoice.service';

const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unitZar: z.number(),
  totalZar: z.number(),
});

const invoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  dueDate: z.string(),
  amountZar: z.number(),
  agencyFeeZar: z.number(),
  wholesaleTotalZar: z.number(),
  lineItems: z.array(lineItemSchema),
  status: z.string(),
  paystackPaymentUrl: z.string().nullable(),
  paidAt: z.string().nullable(),
  remindersSent: z.number(),
  createdAt: z.string(),
});

export const synkraAgencyInvoiceController: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/invoices',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        response: { 200: z.object({ invoices: z.array(invoiceSchema) }) },
      },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');

      const agency = await synkraAgencyService(request.log).getForUser(principal.id);
      if (!agency) return { invoices: [] };

      const invoices = await synkraAgencyInvoiceService(request.log).list(agency.id);
      return {
        invoices: invoices.map((i) => ({
          id: i.id,
          invoiceNumber: i.invoiceNumber,
          periodStart: new Date(i.periodStart).toISOString(),
          periodEnd: new Date(i.periodEnd).toISOString(),
          dueDate: new Date(i.dueDate).toISOString(),
          amountZar: i.amountZar,
          agencyFeeZar: i.agencyFeeZar,
          wholesaleTotalZar: i.wholesaleTotalZar,
          lineItems: i.lineItems ?? [],
          status: i.status,
          paystackPaymentUrl: i.paystackPaymentUrl,
          paidAt: i.paidAt ? new Date(i.paidAt).toISOString() : null,
          remindersSent: i.remindersSent,
          createdAt: new Date(i.created).toISOString(),
        })),
      };
    },
  );

  app.get(
    '/invoices/:id',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: { params: z.object({ id: z.string() }) },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');

      const agency = await synkraAgencyService(request.log).getForUser(principal.id);
      if (!agency) throw new Error('No agency');

      const invoice = await synkraAgencyInvoiceService(request.log).getById(request.params.id);
      if (!invoice || invoice.agencyId !== agency.id) {
        throw new Error('Invoice not found');
      }
      return invoice;
    },
  );

  /**
   * Manually trigger an invoice for testing (owner only, no auth check).
   * Useful during development.
   */
  app.post(
    '/invoices/regenerate',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');

      const agency = await synkraAgencyService(request.log).getForUser(principal.id);
      if (!agency) throw new Error('No agency');

      const now = new Date();
      const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

      const inv = await synkraAgencyInvoiceService(request.log).generateInvoice({
        agencyId: agency.id,
        periodStart,
        periodEnd,
      });
      return { ok: true, invoiceId: inv?.id ?? null };
    },
  );
};
