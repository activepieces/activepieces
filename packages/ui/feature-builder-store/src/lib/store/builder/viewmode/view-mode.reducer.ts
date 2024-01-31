import { Action, createReducer, on } from '@ngrx/store';
import { ViewModeActions } from './view-mode.action';
import { ViewModeEnum } from '../../../model/enums/view-mode.enum';
import { canvasActions } from '../canvas/canvas.action';

const initialState: any = ViewModeEnum.BUILDING;

const _viewModeReducer = createReducer(
  initialState,
  on(ViewModeActions.setInitial, (state, { viewMode }): ViewModeEnum => {
    return viewMode;
  }),
  on(ViewModeActions.setViewMode, (state, { viewMode }): ViewModeEnum => {
    return viewMode;
  }),
  on(canvasActions.viewRun, (state): ViewModeEnum => {
    return state === ViewModeEnum.VIEW_INSTANCE_RUN
      ? ViewModeEnum.VIEW_INSTANCE_RUN
      : ViewModeEnum.SHOW_OLD_VERSION;
  }),
  on(canvasActions.exitRun, (): ViewModeEnum => {
    return ViewModeEnum.BUILDING;
  })
);

export function viewModeReducer(state: ViewModeEnum, action: Action) {
  return _viewModeReducer(state, action);
}
