import { ALL_PRINCIPAL_TYPES } from '@activepieces/shared';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { securityAccess } from '../../core/security/authorization/fastify-security';

export const synkraHealthController: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        response: {
          200: z.object({
            ok: z.boolean(),
            service: z.string(),
            uptimeSec: z.number(),
            timestamp: z.string(),
          }),
        },
      },
    },
    async () => ({
      ok: true,
      service: 'synkra-flow',
      uptimeSec: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    }),
  );
};
