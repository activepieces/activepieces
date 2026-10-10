import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OnboardingState, OnboardingStep, synkraOnboardingApi } from './api';

const key = ['synkra-onboarding'];

export const synkraOnboardingHooks = {
  useState: () => {
    return useQuery<OnboardingState>({
      queryKey: key,
      queryFn: () => synkraOnboardingApi.get(),
      staleTime: 30_000,
    });
  },

  useAdvance: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (params: {
        step?: OnboardingStep;
        useCase?: string[];
        skipped?: boolean;
        complete?: boolean;
      }) => synkraOnboardingApi.advance(params),
      onSuccess: (data) => {
        qc.setQueryData(key, data);
      },
    });
  },

  useReset: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: () => synkraOnboardingApi.reset(),
      onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    });
  },
};
