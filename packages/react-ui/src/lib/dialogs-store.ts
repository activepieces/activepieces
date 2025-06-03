import { create } from 'zustand';

interface DialogState {
  managePlan: boolean;
  addUserSeats: boolean;
}

interface DialogStore {
  dialogs: DialogState;
  setDialog: (dialog: keyof DialogState, isOpen: boolean) => void;
}

export const useDialogStore = create<DialogStore>((set) => ({
  dialogs: {
    managePlan: false,
    addUserSeats: false,
  },
  setDialog: (dialog, isOpen) => {
    set((state) => ({
      dialogs: {
        ...state.dialogs,
        [dialog]: isOpen,
      },
    }));
  },
}));
