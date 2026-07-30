import type { BillingCycle } from '../components/plan-selector-utils';

import { createPayloadDialogStore } from './create-dialog-store';

export const useConfirmPurchaseDialogStore =
  createPayloadDialogStore<ConfirmPurchasePayload>();

export type ConfirmPurchasePayload = {
  planId: string;
  planName: string;
  priceAmount: string;
  billingCycle: BillingCycle;
  features: string[];
  successUrl: string;
};
