import { create } from 'zustand';

interface ManagePlanDialogStore {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
}

export const useManagePlanDialogStore = create<ManagePlanDialogStore>(
  (set) => ({
    isOpen: false,
    openDialog: () => set({ isOpen: true }),
    closeDialog: () => set({ isOpen: false }),
  }),
);
