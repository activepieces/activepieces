import { createAction, props } from '@ngrx/store';
import { ViewModeEnum } from '../../../model/enums/view-mode.enum';

export enum ViewModeActionType {
  SET_VIEW_MODE = '[VIEW_MODE] SET_VIEW_MODE',
  SET_INITIAL = '[VIEW_MODE] SET_INITIAL',
}

export const setViewMode = createAction(
  ViewModeActionType.SET_VIEW_MODE,
  props<{ viewMode: ViewModeEnum }>()
);
export const setInitial = createAction(
  ViewModeActionType.SET_INITIAL,
  props<{ viewMode: ViewModeEnum }>()
);

export const ViewModeActions = {
  setViewMode,
  setInitial,
};
