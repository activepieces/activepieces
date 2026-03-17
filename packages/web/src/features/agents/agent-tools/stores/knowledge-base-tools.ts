import { AgentKnowledgeBaseTool } from '@activepieces/shared';
import { create } from 'zustand';

interface KnowledgeBaseToolDialogState {
  showAddKbDialog: boolean;
  editingKbTool: AgentKnowledgeBaseTool | null;

  resetDialogState: () => void;
  closeKbDialog: () => void;
  setShowAddKbDialog: (show: boolean, tool?: AgentKnowledgeBaseTool) => void;
}

const initialState = {
  showAddKbDialog: false,
  editingKbTool: null,
};

export const useKnowledgeBaseToolDialogStore =
  create<KnowledgeBaseToolDialogState>((set, get) => ({
    ...initialState,

    setShowAddKbDialog: (show, tool) =>
      set({ showAddKbDialog: show, editingKbTool: tool ?? null }),

    resetDialogState: () => {
      set({
        editingKbTool: null,
      });
    },

    closeKbDialog: () => {
      get().resetDialogState();
      set({ showAddKbDialog: false });
    },
  }));
