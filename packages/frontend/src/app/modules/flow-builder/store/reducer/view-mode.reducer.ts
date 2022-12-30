import { Action, createReducer, on } from '@ngrx/store';
import { ViewModeActions } from '../action/view-mode.action';
import { ViewModeEnum } from '../model/enums/view-mode.enum';

const initialState: any = ViewModeEnum.BUILDING;

const _viewModeReducer = createReducer(
	initialState,
	on(ViewModeActions.setViewMode, (state, { viewMode }): ViewModeEnum => {
		return viewMode;
	})
);

export function viewModeReducer(state: ViewModeEnum, action: Action) {
	return _viewModeReducer(state, action);
}
