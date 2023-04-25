import { createAction, props } from '@ngrx/store';
import {
  AppConnection,
  Flow,
  FlowInstance,
  FlowRun,
  Folder,
} from '@activepieces/shared';
import { ViewModeEnum } from '../../model/enums/view-mode.enum';

export enum BuilderActionType {
  LOAD_INITIAL = '[BUILDER] LOAD_INITIAL',
}

export const loadInitial = createAction(
  BuilderActionType.LOAD_INITIAL,
  props<{
    flow: Flow;
    instance?: FlowInstance;
    viewMode: ViewModeEnum;
    run?: FlowRun;
    appConnections: AppConnection[];
    folder?: Folder;
  }>()
);

export const BuilderActions = {
  loadInitial,
};
