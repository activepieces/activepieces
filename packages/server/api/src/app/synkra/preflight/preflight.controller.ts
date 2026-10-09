import { ALL_PRINCIPAL_TYPES, PrincipalType } from '@activepieces/shared';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { securityAccess } from '../../core/security/authorization/fastify-security';
import { system } from '../../helper/system/system';
import { AppSystemProp } from '../../helper/system/system-props';

type Check = {
  key: string;
  label: string;
  ok: boolean;
  envVar: string;
  hint: string;
};

const checkSchema = z.object({
  key: z.string(),
  label: z.string(),
  ok: z.boolean(),
  envVar: z.string(),
  hint: z.string(),
});

export const synkraPreflightController: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        response: {
          200: z.object({
            ok: z.boolean(),
            checks: z.array(checkSchema),
          }),
        },
      },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) {
        return { ok: false, checks: [] };
      }

      const has = (prop: AppSystemProp): boolean => !!system.get(prop);
      const hasEnv = (name: string): boolean => !!process.env[name];

      const checks: Check[] = [
        {
          key: 'db',
          label: 'Database configured',
          ok: hasEnv('AP_DB_HOST') || hasEnv('DB_HOST'),
          envVar: 'AP_DB_HOST',
          hint: 'Postgres connection',
        },
        {
          key: 'redis',
          label: 'Redis configured',
          ok: has(AppSystemProp.REDIS_HOST),
          envVar: 'AP_REDIS_HOST',
          hint: 'Cache + queue',
        },
        {
          key: 's3',
          label: 'S3 storage configured',
          ok: has(AppSystemProp.S3_BUCKET) && has(AppSystemProp.S3_ACCESS_KEY_ID),
          envVar: 'AP_S3_BUCKET + AP_S3_ACCESS_KEY_ID',
          hint: 'File uploads go here',
        },
        {
          key: 'paystack-secret',
          label: 'Paystack secret key',
          ok: has(AppSystemProp.SYNKRA_PAYSTACK_SECRET_KEY),
          envVar: 'SYNKRA_PAYSTACK_SECRET_KEY',
          hint: 'Enables checkout',
        },
        {
          key: 'paystack-webhook',
          label: 'Paystack webhook secret',
          ok: has(AppSystemProp.SYNKRA_PAYSTACK_WEBHOOK_SECRET),
          envVar: 'SYNKRA_PAYSTACK_WEBHOOK_SECRET',
          hint: 'Verifies webhook signatures',
        },
        {
          key: 'paystack-plan-starter',
          label: 'Paystack Starter plan code',
          ok: has(AppSystemProp.SYNKRA_PAYSTACK_PLAN_STARTER),
          envVar: 'SYNKRA_PAYSTACK_PLAN_STARTER',
          hint: 'PLN_xxx for R299/mo',
        },
        {
          key: 'paystack-plan-business',
          label: 'Paystack Business plan code',
          ok: has(AppSystemProp.SYNKRA_PAYSTACK_PLAN_BUSINESS),
          envVar: 'SYNKRA_PAYSTACK_PLAN_BUSINESS',
          hint: 'PLN_xxx for R599/mo',
        },
        {
          key: 'paystack-plan-pro',
          label: 'Paystack Pro plan code',
          ok: has(AppSystemProp.SYNKRA_PAYSTACK_PLAN_PRO),
          envVar: 'SYNKRA_PAYSTACK_PLAN_PRO',
          hint: 'PLN_xxx for R999/mo',
        },
        {
          key: 'resend',
          label: 'Resend API key (preferred)',
          ok: has(AppSystemProp.RESEND_API_KEY),
          envVar: 'RESEND_API_KEY',
          hint: 'HTTP email delivery',
        },
        {
          key: 'smtp',
          label: 'SMTP host (fallback)',
          ok: has(AppSystemProp.SMTP_HOST),
          envVar: 'AP_SMTP_HOST',
          hint: 'Used if Resend is not set',
        },
      ];

      return { ok: checks.every((c) => c.ok), checks };
    },
  );
};
