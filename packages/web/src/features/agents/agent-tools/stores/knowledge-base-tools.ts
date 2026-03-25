import {
  AgentKnowledgeBaseTool,
  KnowledgeBaseSourceType,
} from '@activepieces/shared';
import { create } from 'zustand';

interface KnowledgeBaseToolDialogState {
  showAddKbDialog: boolean;
  editingKbTool: AgentKnowledgeBaseTool | null;
  initialSourceType: KnowledgeBaseSourceType | null;

  closeKbDialog: () => void;
  setShowAddKbDialog: (
    show: boolean,
    tool?: AgentKnowledgeBaseTool,
    sourceType?: KnowledgeBaseSourceType,
  ) => void;
}

const initialState: Pick<
  KnowledgeBaseToolDialogState,
  'showAddKbDialog' | 'editingKbTool' | 'initialSourceType'
> = {
  showAddKbDialog: false,
  editingKbTool: null,
  initialSourceType: null,
};

export const useKnowledgeBaseToolDialogStore =
  create<KnowledgeBaseToolDialogState>((set) => ({
    ...initialState,

    setShowAddKbDialog: (show, tool, sourceType) =>
      set({
        showAddKbDialog: show,
        editingKbTool: tool ?? null,
        initialSourceType:
          tool?.sourceType ?? sourceType ?? KnowledgeBaseSourceType.FILE,
      }),

    closeKbDialog: () => {
      set({
        showAddKbDialog: false,
        editingKbTool: null,
        initialSourceType: null,
      });
    },
  }));
