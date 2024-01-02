import { createAction, props } from '@ngrx/store';
import { ViewModeEnum } from '../../../model/enums/view-mode.enum';
import { FlowVersion } from '@activepieces/shared';

export enum ViewModeActionType {
  SET_VIEW_MODE = '[VIEW_MODE] SET_VIEW_MODE',
  SET_INITIAL = '[VIEW_MODE] SET_INITIAL',
}

export const setViewMode = createAction(
  ViewModeActionType.SET_VIEW_MODE,
  props<
    // eslint-disable-next-line @ngrx/prefer-inline-action-props
    | { viewMode: ViewModeEnum.BUILDING | ViewModeEnum.SHOW_PUBLISHED }
    | { viewMode: ViewModeEnum.SHOW_OLD_VERSION; version: FlowVersion }
  >()
);

export const setInitial = createAction(
  ViewModeActionType.SET_INITIAL,
  props<{ viewMode: ViewModeEnum }>()
);

export const ViewModeActions = {
  setViewMode,
  setInitial,
};
