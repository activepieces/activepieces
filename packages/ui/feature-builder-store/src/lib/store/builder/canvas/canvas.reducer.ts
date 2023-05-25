import { Action, createReducer, on } from '@ngrx/store';

import {
  BuilderState,
  FlowItem,
  LeftSideBarType,
  NO_PROPS,
  RightSideBarType,
} from '../../../model';
import {
  FlowVersionState,
  TriggerType,
  flowHelper,
} from '@activepieces/shared';
import { canvasActions } from './canvas.action';
import { stat } from 'fs';

const initialState: BuilderState = {
  selectedRun: undefined,
  leftSidebar: {
    type: LeftSideBarType.NONE,
  },
  rightSidebar: {
    type: RightSideBarType.NONE,
    props: NO_PROPS,
  },
  focusedStep: undefined,
  selectedStepName: 'initialVal',
  isGeneratingFlowComponentOpen: false,
  displayedFlowVersion: {
    flowId: '1',
    displayName: 'Flow version',
    valid: false,
    updated: '',
    created: '',
    id: '',
    trigger: {
      name: 'empty',
      valid: false,
      displayName: 'Empty Trigger',
      type: TriggerType.EMPTY,
      settings: {},
    },
    state: FlowVersionState.DRAFT,
  },
};

const __CanvasReducer = createReducer(
  initialState,
  on(canvasActions.setInitial, (state, action): BuilderState => {
    return {
      ...initialState,
      displayedFlowVersion: action.displayedFlowVersion,
    };
  }),
  on(canvasActions.deselectFocusedStep, (state): BuilderState => {
    const clonedState: BuilderState = JSON.parse(JSON.stringify(state));
    return {
      ...clonedState,
      focusedStep: undefined,
    };
  }),
  on(
    canvasActions.setRightSidebar,
    (state, { sidebarType, props }): BuilderState => {
      const clonedState: BuilderState = JSON.parse(JSON.stringify(state));
      clonedState.rightSidebar = {
        type: sidebarType,
        props: props,
      };
      return clonedState;
    }
  ),
  on(canvasActions.selectStepByName, (flowState, { stepName }) => {
    const clonedState: BuilderState = JSON.parse(JSON.stringify(flowState));
    if (clonedState.displayedFlowVersion) {
      const step: FlowItem | undefined = flowHelper.getStep(
        clonedState.displayedFlowVersion,
        stepName
      );
      return {
        ...clonedState,
        focusedStep: step,
      };
    }
    return clonedState;
  }),
  on(canvasActions.setLeftSidebar, (state, { sidebarType }): BuilderState => {
    const clonedState: BuilderState = JSON.parse(JSON.stringify(state));
    return {
      ...clonedState,
      leftSidebar: {
        type: sidebarType,
      },
    };
  }),
  on(canvasActions.openGenerateFlowComponent, (state): BuilderState => {
    return {
      ...state,
      leftSidebar: {
        type: LeftSideBarType.NONE,
      },
      rightSidebar: {
        type: RightSideBarType.NONE,
        props: 'NO_PROPS',
      },
      isGeneratingFlowComponentOpen: true,
      selectedRun: undefined,
    };
  })
);

export function flowInstanceReducer(
  state: BuilderState | undefined,
  action: Action
) {
  return __CanvasReducer(state, action);
}
