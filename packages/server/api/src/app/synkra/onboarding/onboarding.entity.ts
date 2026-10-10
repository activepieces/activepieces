import { EntitySchema } from 'typeorm';
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common';

export interface SynkraOnboarding {
  id: string;
  created: string;
  updated: string;
  userId: string;
  onboardingStep: string;
  onboardingSkipped: boolean;
  onboardingStartedAt: Date | null;
  onboardingCompletedAt: Date | null;
  primaryUseCase: string[];
  onboardingVersion: number;
  metadata: Record<string, unknown>;
}

export const SynkraOnboardingEntity = new EntitySchema<SynkraOnboarding>({
  name: 'synkra_onboarding',
  columns: {
    ...BaseColumnSchemaPart,
    userId: ApIdSchema,
    onboardingStep: { type: String, default: 'welcome' },
    onboardingSkipped: { type: Boolean, default: false },
    onboardingStartedAt: { type: 'timestamptz', nullable: true },
    onboardingCompletedAt: { type: 'timestamptz', nullable: true },
    primaryUseCase: { type: 'jsonb', default: [] },
    onboardingVersion: { type: Number, default: 1 },
    metadata: { type: 'jsonb', default: {} },
  },
  indices: [
    { name: 'idx_synkra_onboarding_user', columns: ['userId'], unique: true },
  ],
});
