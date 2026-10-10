import { ALL_PRINCIPAL_TYPES, PrincipalType } from '@activepieces/shared';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { securityAccess } from '../../core/security/authorization/fastify-security';
import { synkraOnboardingService, ONBOARDING_STEPS } from './onboarding.service';

const stepSchema = z.enum(ONBOARDING_STEPS);

export const synkraOnboardingController: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        response: {
          200: z.object({
            step: z.string(),
            skipped: z.boolean(),
            completedAt: z.string().nullable(),
            primaryUseCase: z.array(z.string()),
            startedAt: z.string().nullable(),
            version: z.number(),
          }),
        },
      },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) {
        return {
          step: 'welcome',
          skipped: false,
          completedAt: null,
          primaryUseCase: [],
          startedAt: null,
          version: 1,
        };
      }
      const row = await synkraOnboardingService(request.log).getOrCreateForUser(
        principal.id,
      );
      return {
        step: row.onboardingStep,
        skipped: row.onboardingSkipped,
        completedAt: row.onboardingCompletedAt
          ? new Date(row.onboardingCompletedAt).toISOString()
          : null,
        primaryUseCase: row.primaryUseCase ?? [],
        startedAt: row.onboardingStartedAt
          ? new Date(row.onboardingStartedAt).toISOString()
          : null,
        version: row.onboardingVersion,
      };
    },
  );

  app.patch(
    '/',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        body: z.object({
          step: stepSchema.optional(),
          useCase: z.array(z.string()).optional(),
          skipped: z.boolean().optional(),
          complete: z.boolean().optional(),
        }),
        response: {
          200: z.object({
            step: z.string(),
            skipped: z.boolean(),
            completedAt: z.string().nullable(),
            primaryUseCase: z.array(z.string()),
          }),
        },
      },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) {
        throw new Error('Must be signed in.');
      }
      const row = await synkraOnboardingService(request.log).advance({
        userId: principal.id,
        step: request.body.step,
        useCase: request.body.useCase,
        skipped: request.body.skipped,
        complete: request.body.complete,
      });
      return {
        step: row.onboardingStep,
        skipped: row.onboardingSkipped,
        completedAt: row.onboardingCompletedAt
          ? new Date(row.onboardingCompletedAt).toISOString()
          : null,
        primaryUseCase: row.primaryUseCase ?? [],
      };
    },
  );

  app.post(
    '/reset',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) {
        throw new Error('Must be signed in.');
      }
      const row = await synkraOnboardingService(request.log).reset(principal.id);
      return { ok: true, step: row.onboardingStep };
    },
  );
};
