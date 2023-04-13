import { createAction, props } from '@ngrx/store';
import { AppConnection, Flow, FlowRun } from '@activepieces/shared';
import { ViewModeEnum } from '../../model/enums/view-mode.enum';

export enum BuilderActionType {
  LOAD_INITIAL = '[BUILDER] LOAD_INITIAL',
}

export const loadInitial = createAction(
  BuilderActionType.LOAD_INITIAL,
  props<{
    flow: Flow;
    viewMode: ViewModeEnum;
    run?: FlowRun;
    appConnections: AppConnection[];
  }>()
);

export const BuilderActions = {
  loadInitial,
};
