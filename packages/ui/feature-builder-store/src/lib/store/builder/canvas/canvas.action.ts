import { createAction, props } from '@ngrx/store';
import {
  FlowVersion,
  StepLocationRelativeToParent,
} from '@activepieces/shared';
import { LeftSideBarType, NO_PROPS, RightSideBarType } from '../../../model';

export enum CanvasActionType {
  SET_LEFT_SIDEBAR = '[CANVAS] SET_LEFT_SIDEBAR',
  SET_RIGHT_SIDEBAR = '[CANVAS] SET_RIGHT_BAR',
  DESELECT_STEP = '[CANVAS] DESELECT_STEP',
  SELECT_STEP_BY_NAME = '[CANVAS] SELECT_STEP_BY_NAME',
  SET_DISPLAYED_FLOW_VERSION = '[CANVAS] SET_DISPLAYED_FLOW_VERSION',
  SET_INITIAL = '[CANVAS] SET_INITIAL',
  OPEN_GENERATE_FLOW_COMPONENT = '[CANVAS] OPEN_GENERATE_FLOW_COMPONENT',
}

const setInitial = createAction(
  CanvasActionType.SET_INITIAL,
  props<{ displayedFlowVersion: FlowVersion }>()
);
const setLeftSidebar = createAction(
  CanvasActionType.SET_LEFT_SIDEBAR,
  props<{ sidebarType: LeftSideBarType }>()
);

const setRightSidebar = createAction(
  CanvasActionType.SET_RIGHT_SIDEBAR,
  props<{
    sidebarType: RightSideBarType;
    props:
      | {
          stepLocationRelativeToParent: StepLocationRelativeToParent;
          stepName: string;
        }
      | typeof NO_PROPS;
    deselectCurrentStep: boolean;
  }>()
);

const openGenerateFlowComponent = createAction(
  CanvasActionType.OPEN_GENERATE_FLOW_COMPONENT
);

const selectStepByName = createAction(
  CanvasActionType.SELECT_STEP_BY_NAME,
  props<{ stepName: string }>()
);
const deselectFocusedStep = createAction(CanvasActionType.DESELECT_STEP);

export const canvasActions = {
  setInitial,
  setLeftSidebar,
  setRightSidebar,
  selectStepByName,
  deselectFocusedStep,
  openGenerateFlowComponent,
};
