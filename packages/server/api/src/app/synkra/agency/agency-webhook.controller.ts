import { ALL_PRINCIPAL_TYPES } from '@activepieces/shared';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { securityAccess } from '../../core/security/authorization/fastify-security';
import { system } from '../../helper/system/system';
import { AppSystemProp } from '../../helper/system/system-props';
import { repoFactory } from '../../core/db/repo-factory';
import { SynkraAgencyClient, SynkraAgencyClientEntity } from './agency-client.entity';
import { SynkraAgency, SynkraAgencyEntity } from './agency.entity';
import { synkraAgencyInvoiceService } from './invoice.service';

const agencyRepo = repoFactory<SynkraAgency>(SynkraAgencyEntity);
const clientRepo = repoFactory<SynkraAgencyClient>(SynkraAgencyClientEntity);

export const synkraAgencyWebhookController: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/agency-webhook',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        body: z.object({
          event: z.string(),
          data: z.record(z.string(), z.unknown()),
        }),
      },
    },
    async (request, reply) => {
      // Signature verification.
      const expectedSecret = system.get(AppSystemProp.SYNKRA_PAYSTACK_WEBHOOK_SECRET);
      if (expectedSecret) {
        const got = request.headers['x-paystack-signature'];
        const crypto = await import('crypto');
        const hmac = crypto.createHmac('sha512', expectedSecret);
        hmac.update(JSON.stringify(request.body));
        const expected = hmac.digest('hex');
        if (got !== expected) {
          return reply.status(401).send({ ok: false, error: 'invalid_signature' });
        }
      }

      const { event, data } = request.body;
      const log = request.log;

      if (event !== 'charge.success') {
        return { ok: true, skipped: event };
      }

      const meta = (data.metadata as Record<string, unknown>) ?? {};
      if (meta['invoiceType'] !== 'agency_monthly') {
        return { ok: true, skipped: 'not_agency_invoice' };
      }

      const reference = data.reference as string | undefined;
      if (!reference) {
        log.warn({ event }, 'agency-webhook: charge.success without reference');
        return { ok: true, skipped: 'no_reference' };
      }

      const invoiceSvc = synkraAgencyInvoiceService(log);
      const invoice = await invoiceSvc.findByPaystackReference(reference);
      if (!invoice) {
        log.warn({ reference }, 'agency-webhook: unknown reference');
        return { ok: true, skipped: 'unknown_reference' };
      }

      if (invoice.status === 'paid') {
        return { ok: true, already_paid: true };
      }

      // Mark paid.
      await invoiceSvc.markPaid(invoice.id);

      // Unsuspend agency + all clients.
      await agencyRepo().update({ id: invoice.agencyId }, { status: 'active' });
      await clientRepo().update(
        { agencyId: invoice.agencyId, status: 'suspended' },
        { status: 'active' },
      );

      // Send restoration email.
      try {
        const agency = await agencyRepo().findOneByOrFail({ id: invoice.agencyId });
        const { userService } = await import('../../user/user-service');
        const { userIdentityService } = await import(
          '../../authentication/user-identity/user-identity-service'
        );
        const { billingEmailService } = await import('../billing/billing-email.service');

        const owner = await userService(log).getOneOrFail({ id: agency.ownerUserId });
        const ident = await userIdentityService(log).getOneOrFail({
          id: owner.identityId,
        });

        billingEmailService(log).sendAgencyRestored({
          to: ident.email,
          invoiceNumber: invoice.invoiceNumber,
        });
      } catch (err) {
        log.warn({ err, invoiceId: invoice.id }, 'agency-webhook: restoration email failed');
      }

      log.info(
        { invoiceId: invoice.id, agencyId: invoice.agencyId, amount: invoice.amountZar },
        'agency-webhook: invoice paid and agency restored',
      );

      return { ok: true, paid: true };
    },
  );
};
