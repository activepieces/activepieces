import { FeatureKey } from '../components/request-trial';

import { createPayloadDialogStore } from './create-dialog-store';

export const useEnterpriseTrialDialogStore =
  createPayloadDialogStore<EnterpriseTrialDialogPayload>();

export type EnterpriseTrialDialogPayload = {
  featureKey?: FeatureKey;
};
