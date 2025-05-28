import { create } from 'zustand';

type ManagePlanDialogStore = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export const useManagePlanDialogStore = create<ManagePlanDialogStore>(
  (set) => ({
    isOpen: false,
    setIsOpen: (isOpen) => set({ isOpen }),
  }),
);
