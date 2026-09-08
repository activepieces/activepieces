import {
  ChatPersonalizationStatus,
  ChatPersonalizationView,
  chatPersonalizationUtils,
} from '@activepieces/shared';

function resolveInitialAnswers({
  view,
  platformName,
}: {
  view: Pick<
    ChatPersonalizationView,
    'roleInput' | 'companyInput' | 'profile' | 'prefill' | 'personalStatus'
  >;
  platformName: string | null | undefined;
}): InitialOnboardingAnswers {
  const { roleInput, companyInput, profile, prefill, personalStatus } = view;
  const answeredThemselves = personalStatus !== ChatPersonalizationStatus.UNSET;
  return {
    role: answeredThemselves
      ? roleInput ?? profile?.userRole ?? prefill?.role ?? ''
      : prefill?.role ?? '',
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
