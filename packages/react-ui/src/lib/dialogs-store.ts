import { create } from 'zustand';

interface DialogState {
  managePlan: boolean;
  editTasksLimit: boolean;
}

interface DialogStore {
  dialogs: DialogState;
  setDialog: (dialog: keyof DialogState, isOpen: boolean) => void;
}

export const useDialogStore = create<DialogStore>((
  set,
) => ({
  dialogs: {
    managePlan: false,
    editTasksLimit: false,
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
