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

const ONE_HOUR_MS = 60 * 60 * 1000;

export const synkraBillingModule: FastifyPluginAsyncZod = async (app) => {
  synkraBootSeed(app.log).verifyBillingConfig();

  synkraBundledPiecesService(app.log).installAll().catch((err) => {
    app.log.error({ err }, 'synkra bundled pieces install failed at boot');
  });

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
  await app.register(synkraHealthController, { prefix: '/v1/synkra/health' });
  await app.register(synkraPreflightController, { prefix: '/v1/synkra/preflight' });
  await app.register(synkraAiBalanceController, { prefix: '/v1/synkra/ai' });
};
