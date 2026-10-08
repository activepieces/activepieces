import { ALL_PRINCIPAL_TYPES, PrincipalType } from '@activepieces/shared';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { securityAccess } from '../../core/security/authorization/fastify-security';
import { synkraCheckoutService } from './checkout.service';

export const synkraCheckoutController: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/checkout',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        body: z.object({
          tier: z.enum(['starter', 'business', 'pro']),
          callbackUrl: z.string().url(),
          email: z.string().email().optional(),
        }),
        response: {
          200: z.object({
            authorizationUrl: z.string(),
            reference: z.string(),
            accessCode: z.string(),
          }),
        },
      },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) {
        throw new Error('Must be signed in to check out.');
      }
      const email = request.body.email ?? (principal as unknown as { email?: string }).email ?? '';
      return synkraCheckoutService(request.log).initialize({
        userId: principal.id,
        email,
        tier: request.body.tier,
        callbackUrl: request.body.callbackUrl,
      });
    },
  );
};
