import { PlatformPlan, PlatformPlanLimits } from '@activepieces/shared';

import { api } from '@/lib/api';

export const devToolsApi = {
  setPlan(patch: Partial<PlatformPlanLimits>) {
    return api.post<PlatformPlan>('/v1/dev-tools/plan', patch);
  },
  applyPreset(preset: DevToolsPlanPreset) {
    return api.post<PlatformPlan>('/v1/dev-tools/plan/preset', { preset });
  },
  setCredits(body: { includedAiCredits?: number; drainToZero?: boolean }) {
    return api.post<PlatformPlan>('/v1/dev-tools/credits', body);
  },
};

export type DevToolsPlanPreset =
  | 'OPEN_SOURCE'
  | 'STANDARD_CLOUD'
  | 'ENTERPRISE';
export type DevToolsPlanAction =
  | { type: 'patch'; patch: Partial<PlatformPlanLimits> }
  | { type: 'preset'; preset: DevToolsPlanPreset }
  | { type: 'credits'; includedAiCredits?: number; drainToZero?: boolean };
