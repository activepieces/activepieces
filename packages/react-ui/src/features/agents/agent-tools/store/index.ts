import { create } from 'zustand';

import { PieceStepMetadataWithSuggestions } from '@/lib/types';
import { ActionBase } from '@activepieces/pieces-framework';
import {
  AgentMcpTool,
  AgentPieceTool,
  AgentToolType,
  isNil,
  PredefinedInputsStructure,
} from '@activepieces/shared';

type SelectedDialogPage = 'pieces-list' | 'piece-selected' | 'action-selected';

interface AgentToolsState {
  showAddPieceDialog: boolean;
  showAddFlowDialog: boolean;
  showAddMcpDialog: boolean;
  selectedPage: SelectedDialogPage;

  searchQuery: string;

  selectedPiece: PieceStepMetadataWithSuggestions | null;
  selectedAction: ActionBase | null;
  predefinedInputs: PredefinedInputsStructure | null;

  editingPieceTool: AgentPieceTool | null;
  editingMcpTool: AgentMcpTool | null;

  setShowAddPieceDialog: (show: boolean) => void;
  setShowAddFlowDialog: (show: boolean) => void;
  setShowAddMcpDialog: (show: boolean, tool?: AgentMcpTool) => void;
  setSelectedPage: (page: SelectedDialogPage) => void;
  setSearchQuery: (query: string) => void;
  setSelectedPiece: (piece: PieceStepMetadataWithSuggestions | null) => void;
  setSelectedAction: (action: ActionBase | null) => void;
  setPredefinedInputs: (inputs: PredefinedInputsStructure) => void;

  openPieceDialog: ({
    defaultPage,
    tool,
    piece,
  }: {
    defaultPage?: SelectedDialogPage;
    tool?: AgentPieceTool;
    piece?: PieceStepMetadataWithSuggestions;
  }) => void;
  handlePieceSelect: (piece: PieceStepMetadataWithSuggestions) => void;
  handleActionSelect: (action: ActionBase) => void;
  goBackToPiecesList: () => void;
  goBackToPieceSelected: () => void;

  isAuthSet: () => boolean;

  createNewTool: () => AgentPieceTool | null;

  resetDialogState: () => void;
  closePieceDialog: () => void;
}

const initialState = {
  showAddPieceDialog: false,
  showAddFlowDialog: false,
  showAddMcpDialog: false,
  selectedPage: 'pieces-list' as SelectedDialogPage,
  searchQuery: '',
  selectedPiece: null,
  selectedAction: null,
  predefinedInputs: null,
  editingPieceTool: null,
  editingMcpTool: null,
};

export const useAgentToolsStore = create<AgentToolsState>((set, get) => ({
  ...initialState,

  setShowAddPieceDialog: (show) => {
    set({ showAddPieceDialog: show });
    if (!show) {
      get().resetDialogState();
    }
  },
  setShowAddMcpDialog: (show, tool) =>
    set({ showAddMcpDialog: show, editingMcpTool: tool }),

  setShowAddFlowDialog: (show) => set({ showAddFlowDialog: show }),

  setSelectedPage: (page) => set({ selectedPage: page }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedPiece: (piece) => set({ selectedPiece: piece }),
  setSelectedAction: (action) => set({ selectedAction: action }),
  setPredefinedInputs: (inputs) => set({ predefinedInputs: inputs }),

  openPieceDialog: ({ defaultPage = 'pieces-list', tool, piece }) => {
    set({
      showAddPieceDialog: true,
      selectedPage: defaultPage,
      editingPieceTool: tool || null,
      predefinedInputs: tool?.pieceMetadata
        .predefinedInput as PredefinedInputsStructure,
      selectedPiece: piece,
    });
  },

  handlePieceSelect: (piece) => {
    set({
      selectedPiece: piece,
      selectedPage: 'piece-selected',
    });
  },

  handleActionSelect: (action) => {
    set({
      selectedAction: action,
      selectedPage: 'action-selected',
    });
  },

  goBackToPiecesList: () => {
    set({
      selectedPage: 'pieces-list',
      selectedPiece: null,
      selectedAction: null,
      searchQuery: '',
      predefinedInputs: null,
    });
  },

  goBackToPieceSelected: () => {
    set({
      selectedPage: 'piece-selected',
      selectedAction: null,
      predefinedInputs: null,
    });
  },

  isAuthSet: () => {
    const { selectedPiece, selectedAction, predefinedInputs } = get();

    return !!(
      selectedPiece &&
      selectedAction &&
      (!selectedAction.requireAuth ||
        isNil(selectedPiece.auth) ||
        !isNil(predefinedInputs?.auth))
    );
  },

  createNewTool: () => {
    const { selectedAction, selectedPiece, predefinedInputs, isAuthSet } =
      get();

    if (
      !selectedAction ||
      !selectedPiece ||
      !isAuthSet() ||
      !predefinedInputs
    ) {
      return null;
    }

    return {
      type: AgentToolType.PIECE,
      toolName: `${selectedPiece.pieceName}-${selectedAction.name}`,
      pieceMetadata: {
        pieceVersion: selectedPiece.pieceVersion,
        pieceName: selectedPiece.pieceName,
        actionName: selectedAction.name,
        predefinedInput: predefinedInputs,
      },
    };
  },

  resetDialogState: () => {
    set({
      selectedPage: 'pieces-list',
      searchQuery: '',
      selectedPiece: null,
      selectedAction: null,
      predefinedInputs: null,
      editingPieceTool: null,
    });
  },

  closePieceDialog: () => {
    set({
      showAddPieceDialog: false,
      selectedPage: 'pieces-list',
      searchQuery: '',
      selectedPiece: null,
      selectedAction: null,
      predefinedInputs: null,
      editingPieceTool: null,
    });
  },
}));
