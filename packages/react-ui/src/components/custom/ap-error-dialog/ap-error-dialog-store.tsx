import { create } from 'zustand';

import { ApErrorParams } from '@activepieces/shared';

interface ApErrorDialogStore {
  error: ApErrorParams | null;
  openDialog: (error: ApErrorParams) => void;
  closeDialog: () => void;
}

export const useApErrorDialogStore = create<ApErrorDialogStore>((set) => ({
  error: null,
  openDialog: (error) => set({ error }),
  closeDialog: () => set({ error: null }),
}));
