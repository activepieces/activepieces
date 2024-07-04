import { createAction, props } from '@ngrx/store';
import {
  FlowRun,
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
  SET_RUN = '[CANVAS] SET_RUN',
  EXIT_RUN = '[CANVAS] EXIT_RUN',
  SET_ADD_BUTTON_ID = '[CANVAS] SET_ADD_BUTTON_ID',
  CLEAR_ADD_BUTTON_ID = '[CANVAS] CLEAR_ADD_BUTTON_ID',
  VIEW_VERSION = '[CANVAS] VIEW_VERSION',
  UPDATE_VIEWED_VERSION_ID = `[CANVAS] UPDATE_VIEWED_VERSION_ID`,
  VIEW_RUN = '[CANVAS] VIEW_RUN',
  SET_LOOP_INDEX_FOR_RUN = '[CANVAS] SET_LOOP_INDEX_FOR_RUN',
}

const setInitial = createAction(
  CanvasActionType.SET_INITIAL,
  props<{ displayedFlowVersion: FlowVersion; run?: FlowRun }>()
);
/**Used for when you edit a published flow and a draft is created */
const updateViewedVersionId = createAction(
  CanvasActionType.UPDATE_VIEWED_VERSION_ID,
  props<{ versionId: string }>()
);

const viewVersion = createAction(
  CanvasActionType.VIEW_VERSION,
  props<{ viewedFlowVersion: FlowVersion }>()
);
const setLeftSidebar = createAction(
  CanvasActionType.SET_LEFT_SIDEBAR,
  props<{ sidebarType: LeftSideBarType }>()
);

const setAddButtonId = createAction(
  CanvasActionType.SET_ADD_BUTTON_ID,
  props<{ id: number }>()
);
const clearAddButtonId = createAction(CanvasActionType.SET_ADD_BUTTON_ID);
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

const selectStepByName = createAction(
  CanvasActionType.SELECT_STEP_BY_NAME,
  props<{ stepName: string }>()
);
const deselectStep = createAction(CanvasActionType.DESELECT_STEP);
const exitRun = createAction(
  CanvasActionType.EXIT_RUN,
  props<{ flowVersion: FlowVersion }>()
);
const viewRun = createAction(
  CanvasActionType.VIEW_RUN,
  props<{ run: FlowRun; version: FlowVersion }>()
);
const setRun = createAction(
  CanvasActionType.SET_RUN,
  props<{ run: FlowRun }>()
);
const setLoopIndexForRun = createAction(
  CanvasActionType.SET_LOOP_INDEX_FOR_RUN,
  props<{ loopIndex: number; stepName: string }>()
);
export const canvasActions = {
  setInitial,
  setLeftSidebar,
  setRightSidebar,
  selectStepByName,
  deselectStep,
  setRun,
  exitRun,
  setAddButtonId,
  clearAddButtonId,
  viewVersion,
  /**Used for when you edit a published flow and a draft is created */
  updateViewedVersionId,
  viewRun,
  setLoopIndexForRun,
};
