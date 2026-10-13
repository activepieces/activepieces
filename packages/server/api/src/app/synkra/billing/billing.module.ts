import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { paystackWebhookController } from './paystack-webhook.controller';
import { synkraSubscriptionController } from './subscription.controller';
import { synkraCheckoutController } from './checkout.controller';
import { synkraBootSeed } from './boot-seed.service';
import { synkraBundledPiecesService } from './bundled-pieces.service';
import { synkraRenewalsService } from './renewals.service';
import { synkraHealthController } from '../health/health.controller';
import { synkraPreflightController } from '../preflight/preflight.controller';
import { synkraAiBalanceController } from '../ai/ai-balance.controller';
import { synkraOauthSeed } from '../oauth/oauth-seed.service';
import { synkraOnboardingController } from '../onboarding/onboarding.controller';
import { synkraAgencyController } from '../agency/agency.controller';
import { synkraAgencyPortalController } from '../agency/portal.controller';
import { synkraAgencyInvoiceController } from '../agency/invoice.controller';
import { synkraAgencyBillingCron } from '../agency/billing-cron.service';
import { synkraAgencyWebhookController } from '../agency/agency-webhook.controller';
import { synkraDashboardController } from '../dashboard/dashboard.controller';
import { synkraCreditsController } from '../credits/credits.controller';

const ONE_HOUR_MS = 60 * 60 * 1000;

export const synkraBillingModule: FastifyPluginAsyncZod = async (app) => {
  synkraBootSeed(app.log).verifyBillingConfig();

  // Seed OAuth apps from env (idempotent, safe on every boot).
  synkraOauthSeed(app.log).seedAll().catch((err) => {
    app.log.error({ err }, 'synkra oauth seed failed at boot');
  });

  synkraBundledPiecesService(app.log).installAll().catch((err) => {
    app.log.error({ err }, 'synkra bundled pieces install failed at boot');
  });

  // Agency billing cron — runs hourly.
  // Generates invoices, sends reminders, enforces overdue.
  const agencyRef = globalThis as unknown as { __synkraAgencyCronTimer?: NodeJS.Timeout };
  if (!agencyRef.__synkraAgencyCronTimer) {
    const runAgency = () => {
      synkraAgencyBillingCron(app.log)
        .runOnce()
        .then((s) => {
          if (s.invoicesGenerated || s.remindersSent || s.agenciesPaused) {
            app.log.info(s, 'synkra agency billing cron completed');
          }
        })
        .catch((err) => app.log.error({ err }, 'synkra agency billing cron threw'));
    };
    setTimeout(runAgency, 90_000);
    agencyRef.__synkraAgencyCronTimer = setInterval(runAgency, ONE_HOUR_MS);
    app.log.info('synkra agency billing cron scheduled (hourly)');
  }

  const globalRef = globalThis as unknown as { __synkraRenewalsTimer?: NodeJS.Timeout };
  if (!globalRef.__synkraRenewalsTimer) {
    const run = () => {
      synkraRenewalsService(app.log)
        .runOnce()
        .then((s) => {
          if (s.reminders || s.renewals || s.downgrades) {
            app.log.info(s, 'synkra renewals job completed');
          }
        })
        .catch((err) => app.log.error({ err }, 'synkra renewals job threw'));
    };
    setTimeout(run, 60_000);
    globalRef.__synkraRenewalsTimer = setInterval(run, ONE_HOUR_MS);
    app.log.info('synkra renewals job scheduled (hourly)');
  }

  await app.register(synkraSubscriptionController, { prefix: '/v1/synkra/subscription' });
  await app.register(synkraCheckoutController, { prefix: '/v1/synkra/subscription' });
  await app.register(paystackWebhookController, { prefix: '/v1/synkra/paystack' });
  await app.register(synkraAgencyWebhookController, { prefix: '/v1/synkra/paystack' });
  await app.register(synkraDashboardController, { prefix: '/v1/synkra/dashboard' });
  await app.register(synkraCreditsController, { prefix: '/v1/synkra/credits' });
  await app.register(synkraHealthController, { prefix: '/v1/synkra/health' });
  await app.register(synkraPreflightController, { prefix: '/v1/synkra/preflight' });
  await app.register(synkraAiBalanceController, { prefix: '/v1/synkra/ai' });
  await app.register(synkraOnboardingController, { prefix: '/v1/synkra/onboarding' });
  await app.register(synkraAgencyController, { prefix: '/v1/synkra/agency' });
  await app.register(synkraAgencyPortalController, { prefix: '/v1/synkra/agency' });
  await app.register(synkraAgencyInvoiceController, { prefix: '/v1/synkra/agency' });
};
