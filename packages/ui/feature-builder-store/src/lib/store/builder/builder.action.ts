import { createAction, props } from '@ngrx/store';
import {
  AppConnectionWithoutSensitiveData,
  Flow,
  FlowInstance,
  FlowRun,
  FlowVersion,
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
    appConnections: AppConnectionWithoutSensitiveData[];
    folder?: Folder;
    publishedVersion?: FlowVersion;
  }>()
);

export const BuilderActions = {
  loadInitial,
};
