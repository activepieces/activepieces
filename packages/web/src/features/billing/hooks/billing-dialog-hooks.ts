import { create } from 'zustand';

import type { BillingCycle } from '../components/plan-selector-utils';

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

export const billingDialogHooks = {
  useManagePlanDialogStore,
  useConfirmPurchaseDialogStore,
  usePlanSwitchSuccessDialogStore,
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
