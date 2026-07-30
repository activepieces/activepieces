import { create } from 'zustand';

export function createToggleDialogStore() {
  return create<ToggleDialogStore>((set) => ({
    isOpen: false,
    openDialog: () => set({ isOpen: true }),
    closeDialog: () => set({ isOpen: false }),
  }));
}

export function createPayloadDialogStore<TPayload>() {
  return create<PayloadDialogStore<TPayload>>((set) => ({
    payload: null,
    openDialog: (payload) => set({ payload }),
    closeDialog: () => set({ payload: null }),
  }));
}

export type ToggleDialogStore = {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
};

export type PayloadDialogStore<TPayload> = {
  payload: TPayload | null;
  openDialog: (payload: TPayload) => void;
  closeDialog: () => void;
};
