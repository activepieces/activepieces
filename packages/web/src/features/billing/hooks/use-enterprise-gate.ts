import { ApEdition, ApFlagId } from '@activepieces/shared';

import { flagsHooks } from '@/hooks/flags-hooks';

import { FeatureKey } from '../components/request-trial';
import { enterpriseDocs } from '../utils/enterprise-docs';

import { billingDialogHooks } from './billing-dialog-hooks';
import { enterpriseTrialHooks } from './enterprise-trial-hooks';

export function useEnterpriseAccess({
  unlocked,
}: {
  unlocked: boolean;
}): EnterpriseAccess {
  const trial = enterpriseTrialHooks.useTrial();
  const offer = enterpriseTrialHooks.useOffer();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  if (unlocked) {
    return trial.state === 'active' ? 'trialing' : 'entitled';
  }
  if (edition === ApEdition.COMMUNITY) {
    return 'community';
  }
  if (!trial.isPlatformAdmin) {
    return 'ask_admin';
  }
  if (offer) {
    return 'trial_available';
  }
  if (trial.state === 'ended' || trial.state === 'used') {
    return 'trial_used';
  }
  return 'upgrade';
}

export function useEnterpriseGate({
  unlocked,
  featureKey,
}: {
  unlocked: boolean;
  featureKey: FeatureKey;
}): EnterpriseGate {
  const access = useEnterpriseAccess({ unlocked });
  const { openDialog } = billingDialogHooks.useEnterpriseTrialDialogStore();
  const locked = access !== 'entitled' && access !== 'trialing';

  const run = (
    action: () => Promise<unknown> | void,
    options?: { resumable?: boolean },
  ) => {
    if (!locked) {
      Promise.resolve(action()).catch(() => undefined);
      return;
    }
    if (access === 'community') {
      window.open(enterpriseDocs.switchToEnterpriseUrl, '_blank', 'noopener');
      return;
    }
    const resumable = options?.resumable ?? true;
    openDialog({
      featureKey,
      resume: resumable ? async () => action() : undefined,
    });
  };

  const explain = () => openDialog({ featureKey });

  return { access, locked, run, explain };
}

export type EnterpriseAccess =
  | 'entitled'
  | 'trialing'
  | 'trial_available'
  | 'trial_used'
  | 'upgrade'
  | 'ask_admin'
  | 'community';

export type EnterpriseGate = {
  access: EnterpriseAccess;
  locked: boolean;
  run: (
    action: () => Promise<unknown> | void,
    options?: { resumable?: boolean },
  ) => void;
  explain: () => void;
};
