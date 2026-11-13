import { beforeAll, describe, expect, it } from 'vitest';

import { selfServeTrialFeatures } from '@/features/billing/utils/self-serve-trial-features';

import { icuI18n } from '../../../i18n/icu-i18n';

beforeAll(async () => {
  await icuI18n.init();
});

describe('features the trial does not include', () => {
  it('never offers the trial for dedicated workers', () => {
    expect(selfServeTrialFeatures.isIncludedInTrial('DEDICATED_WORKERS')).toBe(
      false,
    );
  });

  it('offers the trial for other features and for no feature', () => {
    expect(selfServeTrialFeatures.isIncludedInTrial('SSO')).toBe(true);
    expect(selfServeTrialFeatures.isIncludedInTrial(undefined)).toBe(true);
  });

  it('leaves dedicated workers out of the trial feature list', () => {
    const featureKeys = selfServeTrialFeatures
      .list()
      .flatMap((feature) => feature.featureKeys);
    expect(featureKeys).not.toContain('DEDICATED_WORKERS');
  });
});
