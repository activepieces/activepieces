import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { aiProviderController } from './ai-provider-controller';
import { aiSuggestionController } from './ai-suggestion.controller';

export const aiProviderModule: FastifyPluginAsyncZod = async (app) => {
  await app.register(aiProviderController, { prefix: '/v1/ai-providers' });
  await app.register(aiSuggestionController, { prefix: '/v1/ai-suggestions' });
};
