import { create } from 'zustand';
interface ApErrorDialogStore {
  error: unknown | null;
  openDialog: (error: unknown) => void;
  closeDialog: () => void;
}

export const useApErrorDialogStore = create<ApErrorDialogStore>((set) => ({
  error: null,
  openDialog: (error) => set({ error }),
  closeDialog: () => set({ error: null }),
}));
