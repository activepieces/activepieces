import { createContext, useContext } from 'react';
import { create, useStore } from 'zustand';

import { CanvasState, createCanvasState } from './state/canvas-state';
import { ChatState, createChatState } from './state/chat-state';
import { createFlowState, FlowState } from './state/flow-state';
import {
  createPieceSelectorState,
  PieceSelectorState,
} from './state/piece-selector-state';
import { createRunState, RunState } from './state/run-state';
import { createStepFormState, StepFormState } from './state/step-form-state';

export const BuilderStateContext = createContext<BuilderStore | null>(null);

export function useBuilderStateContext<T>(
  selector: (state: BuilderState) => T,
): T {
  const store = useContext(BuilderStateContext);
  if (!store)
    throw new Error('Missing BuilderStateContext.Provider in the tree');
  return useStore(store, selector);
}

export type BuilderState = FlowState &
  PieceSelectorState &
  RunState &
  ChatState &
  CanvasState &
  StepFormState;
export type BuilderInitialState = Pick<
  BuilderState,
  | 'flow'
  | 'flowVersion'
  | 'readonly'
  | 'hideTestWidget'
  | 'run'
  | 'outputSampleData'
  | 'inputSampleData'
>;

export type BuilderStore = ReturnType<typeof createBuilderStore>;
export const createBuilderStore = (initialState: BuilderInitialState) =>
  create<BuilderState>((set, get) => {
    const flowState = createFlowState(initialState, get, set);
    const pieceSelectorState = createPieceSelectorState(get, set);
    const runState = createRunState(initialState, get, set);
    const chatState = createChatState(set);
    const canvasState = createCanvasState(initialState, set);
    const stepFormState = createStepFormState(set);
    return {
      ...flowState,
      ...runState,
      ...pieceSelectorState,
      ...chatState,
      ...canvasState,
      ...stepFormState,
    };
  });
