// Stub for removed billing feature
import { create } from 'zustand';

interface ManagePlanDialogState {
  isOpen: boolean;
  openDialog: () => void;
  close: () => void;
}

export const useManagePlanDialogStore = create<ManagePlanDialogState>((set) => ({
  isOpen: false,
  openDialog: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
