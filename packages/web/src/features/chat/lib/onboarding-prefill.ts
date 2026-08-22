import {
  ChatPersonalizationView,
  chatPersonalizationUtils,
} from '@activepieces/shared';

function resolveInitialAnswers({
  view,
  platformName,
}: {
  view: Pick<
    ChatPersonalizationView,
    'roleInput' | 'companyInput' | 'profile' | 'prefill'
  >;
  platformName: string | null | undefined;
}): InitialOnboardingAnswers {
  const { roleInput, companyInput, profile, prefill } = view;
  return {
    role: roleInput ?? profile?.userRole ?? prefill?.role ?? '',
    company:
      companyInput ??
      chatPersonalizationUtils.companyFromPlatformName(platformName) ??
      '',
    companyDomain: null,
  };
}

export const onboardingPrefillUtils = {
  resolveInitialAnswers,
};

export type InitialOnboardingAnswers = {
  role: string;
  company: string;
  companyDomain: string | null;
};
