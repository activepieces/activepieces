import { create } from 'zustand';

import type { BillingCycle } from '../components/plan-selector-utils';

interface ConfirmPurchaseDialogStore {
  payload: ConfirmPurchasePayload | null;
  openDialog: (payload: ConfirmPurchasePayload) => void;
  closeDialog: () => void;
}

export const useConfirmPurchaseDialogStore = create<ConfirmPurchaseDialogStore>(
  (set) => ({
    payload: null,
    openDialog: (payload) => set({ payload }),
    closeDialog: () => set({ payload: null }),
  }),
);

export type ConfirmPurchasePayload = {
  planId: string;
  planName: string;
  priceAmount: string;
  billingCycle: BillingCycle;
  features: string[];
  successUrl: string;
};
