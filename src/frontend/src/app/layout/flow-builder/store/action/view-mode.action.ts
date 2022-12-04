import { createAction, props } from '@ngrx/store';
import { ViewModeEnum } from '../model/enums/view-mode.enum';

export enum ViewModeActionType {
	SET_VIEW_MODE = '[VIEW_MODE] SET_VIEW_MODE',
}

export const setViewMode = createAction(ViewModeActionType.SET_VIEW_MODE, props<{ viewMode: ViewModeEnum }>());

export const ViewModeActions = {
	setViewMode,
};
