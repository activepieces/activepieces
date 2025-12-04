import { create } from 'zustand';

type ApErrorDialogParams = {
  title: string;
  description: React.ReactNode;
  error: unknown;
};
interface ApErrorDialogStore {
  params: ApErrorDialogParams | null;
  openDialog: (params: ApErrorDialogParams) => void;
  closeDialog: () => void;
}

export const useApErrorDialogStore = create<ApErrorDialogStore>((set) => ({
  params: null,
  openDialog: (params) => set({ params }),
  closeDialog: () => set({ params: null }),
}));
