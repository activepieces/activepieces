import { create } from 'zustand';

import type { BillingCycle } from '../components/plan-selector-utils';
import type { FeatureKey } from '../components/request-trial';

const useManagePlanDialogStore = create<ManagePlanDialogStore>((set) => ({
  isOpen: false,
  openDialog: () => set({ isOpen: true }),
  closeDialog: () => set({ isOpen: false }),
}));

const useConfirmPurchaseDialogStore = create<ConfirmPurchaseDialogStore>(
  (set) => ({
    purchase: null,
    openDialog: (purchase) => set({ purchase }),
    closeDialog: () => set({ purchase: null }),
  }),
);

const usePlanSwitchSuccessDialogStore = create<PlanSwitchSuccessDialogStore>(
  (set) => ({
    planId: null,
    openDialog: (planId) => set({ planId }),
    closeDialog: () => set({ planId: null }),
  }),
);

const useEnterpriseTrialDialogStore = create<EnterpriseTrialDialogStore>(
  (set) => ({
    payload: null,
    returnFocus: null,
    openDialog: (payload) =>
      set({
        payload,
        returnFocus:
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null,
      }),
    closeDialog: () => set({ payload: null }),
  }),
);

export const billingDialogHooks = {
  useManagePlanDialogStore,
  useConfirmPurchaseDialogStore,
  usePlanSwitchSuccessDialogStore,
  useEnterpriseTrialDialogStore,
};

export type EnterpriseTrialDialogPayload = {
  featureKey?: FeatureKey;
  resume?: () => Promise<unknown>;
};

type PlanPurchase = {
  planId: string;
  planName: string;
  priceAmount: string;
  billingCycle: BillingCycle;
  features: string[];
  successUrl: string;
};

type ManagePlanDialogStore = {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
};

type ConfirmPurchaseDialogStore = {
  purchase: PlanPurchase | null;
  openDialog: (purchase: PlanPurchase) => void;
  closeDialog: () => void;
};

type PlanSwitchSuccessDialogStore = {
  planId: string | null;
  openDialog: (planId: string) => void;
  closeDialog: () => void;
};

type EnterpriseTrialDialogStore = {
  payload: EnterpriseTrialDialogPayload | null;
  returnFocus: HTMLElement | null;
  openDialog: (payload: EnterpriseTrialDialogPayload) => void;
  closeDialog: () => void;
};
