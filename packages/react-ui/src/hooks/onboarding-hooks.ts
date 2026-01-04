import { useQuery } from '@tanstack/react-query';

import { onboardingApi } from '@/lib/onboarding-api';

export const onboardingHooks = {
  useOnboarding: () => {
    return useQuery({
      queryKey: ['onboarding-status'],
      queryFn: onboardingApi.get,
    });
  },
};
