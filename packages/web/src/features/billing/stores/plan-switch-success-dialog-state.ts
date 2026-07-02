import { create } from 'zustand';

interface PlanSwitchSuccessDialogStore {
  planId: string | null;
  openDialog: (planId: string) => void;
  closeDialog: () => void;
}

export const usePlanSwitchSuccessDialogStore =
  create<PlanSwitchSuccessDialogStore>((set) => ({
    planId: null,
    openDialog: (planId) => set({ planId }),
    closeDialog: () => set({ planId: null }),
  }));
