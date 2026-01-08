import { PlatformOnboarding } from '@activepieces/ee-shared';

import { api } from './api';

export const onboardingApi = {
  get: async () => {
    return api.get<PlatformOnboarding>('/v1/onboarding');
  },
};
