import { apId, isNil } from '@activepieces/core-utils';
import { FastifyBaseLogger } from 'fastify';
import { repoFactory } from '../../core/db/repo-factory';
import { SynkraOnboarding, SynkraOnboardingEntity } from './onboarding.entity';

const repo = repoFactory<SynkraOnboarding>(SynkraOnboardingEntity);

export const ONBOARDING_STEPS = [
  'welcome',
  'use_case',
  'start_point',
  'connect_tools',
  'build_workflow',
  'test_run',
  'done',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const synkraOnboardingService = (log: FastifyBaseLogger) => ({
  async getOrCreateForUser(userId: string): Promise<SynkraOnboarding> {
    const existing = await repo().findOneBy({ userId });
    if (!isNil(existing)) return existing;
    return repo().save({
      id: apId(),
      userId,
      onboardingStep: 'welcome',
      onboardingSkipped: false,
      primaryUseCase: [],
      onboardingVersion: 1,
      metadata: {},
    });
  },

  async advance(params: {
    userId: string;
    step?: OnboardingStep;
    useCase?: string[];
    skipped?: boolean;
    complete?: boolean;
  }): Promise<SynkraOnboarding> {
    const existing = await this.getOrCreateForUser(params.userId);
    const patch: Partial<SynkraOnboarding> = {};

    if (params.step !== undefined) patch.onboardingStep = params.step;
    if (params.useCase !== undefined) patch.primaryUseCase = params.useCase;
    if (params.skipped !== undefined) patch.onboardingSkipped = params.skipped;
    if (params.complete === true) {
      patch.onboardingCompletedAt = new Date();
      patch.onboardingStep = 'done';
    }
    if (!existing.onboardingStartedAt) {
      patch.onboardingStartedAt = new Date();
    }

    await repo().update({ userId: params.userId }, patch as never);
    return repo().findOneByOrFail({ userId: params.userId });
  },

  async reset(userId: string): Promise<SynkraOnboarding> {
    await repo().update(
      { userId },
      {
        onboardingStep: 'welcome',
        onboardingSkipped: false,
        onboardingCompletedAt: null,
        primaryUseCase: [],
      } as never,
    );
    return repo().findOneByOrFail({ userId });
  },
});
