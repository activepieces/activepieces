import { create } from 'zustand';

export const useAgentToolDialogStore = create<AgentToolDialogState>((set) => ({
  showAddAgentDialog: false,
  setShowAddAgentDialog: (show) => set({ showAddAgentDialog: show }),
}));

type AgentToolDialogState = {
  showAddAgentDialog: boolean;
  setShowAddAgentDialog: (show: boolean) => void;
};
