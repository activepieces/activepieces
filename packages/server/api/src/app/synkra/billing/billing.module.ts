import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { paystackWebhookController } from './paystack-webhook.controller';
import { synkraSubscriptionController } from './subscription.controller';
import { synkraCheckoutController } from './checkout.controller';
import { synkraBootSeed } from './boot-seed.service';
import { synkraBundledPiecesService } from './bundled-pieces.service';

export const synkraBillingModule: FastifyPluginAsyncZod = async (app) => {
  synkraBootSeed(app.log).verifyBillingConfig();
  // Install bundled custom pieces (idempotent, runs on every boot)
  synkraBundledPiecesService(app.log).installAll().catch((err) => {
    app.log.error({ err }, 'synkra bundled pieces install failed at boot');
  });
  await app.register(synkraSubscriptionController, { prefix: '/v1/synkra/subscription' });
  await app.register(synkraCheckoutController, { prefix: '/v1/synkra/subscription' });
  await app.register(paystackWebhookController, { prefix: '/v1/synkra/paystack' });
};
