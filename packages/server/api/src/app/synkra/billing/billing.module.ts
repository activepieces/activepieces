import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { paystackWebhookController } from './paystack-webhook.controller';
import { synkraSubscriptionController } from './subscription.controller';
import { synkraCheckoutController } from './checkout.controller';
import { synkraBootSeed } from './boot-seed.service';

export const synkraBillingModule: FastifyPluginAsyncZod = async (app) => {
  synkraBootSeed(app.log).verifyBillingConfig();
  await app.register(synkraSubscriptionController, { prefix: '/v1/synkra/subscription' });
  await app.register(synkraCheckoutController, { prefix: '/v1/synkra/subscription' });
  await app.register(paystackWebhookController, { prefix: '/v1/synkra/paystack' });
};
