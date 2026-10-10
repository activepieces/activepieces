import { api } from '@/lib/api';

export type OnboardingStep =
  | 'welcome'
  | 'use_case'
  | 'start_point'
  | 'connect_tools'
  | 'build_workflow'
  | 'test_run'
  | 'done';

export type OnboardingState = {
  step: OnboardingStep;
  skipped: boolean;
  completedAt: string | null;
  primaryUseCase: string[];
  startedAt: string | null;
  version: number;
};

export const USE_CASE_OPTIONS = [
  { value: 'sales', label: 'Sales and customer management' },
  { value: 'marketing', label: 'Marketing and communications' },
  { value: 'ecommerce', label: 'E-commerce and payments' },
  { value: 'operations', label: 'Business operations' },
  { value: 'data', label: 'Data processing and reporting' },
  { value: 'ai', label: 'AI-powered workflows' },
  { value: 'other', label: 'Something else' },
] as const;

export const synkraOnboardingApi = {
  get() {
    return api.get<OnboardingState>('/v1/synkra/onboarding');
  },
  advance(params: {
    step?: OnboardingStep;
    useCase?: string[];
    skipped?: boolean;
    complete?: boolean;
  }) {
    return api.patch<OnboardingState>('/v1/synkra/onboarding', params);
  },
  reset() {
    return api.post('/v1/synkra/onboarding/reset', {});
  },
};
