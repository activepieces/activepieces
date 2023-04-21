import { createAction, props } from '@ngrx/store';
import {
  AppConnection,
  Collection,
  Flow,
  FlowRun,
  Instance,
} from '@activepieces/shared';
import { ViewModeEnum } from '../../model/enums/view-mode.enum';

export enum BuilderActionType {
  LOAD_INITIAL = '[BUILDER] LOAD_INITIAL',
}

export const loadInitial = createAction(
  BuilderActionType.LOAD_INITIAL,
  props<{
    collection: Collection;
    flows: Flow[];
    viewMode: ViewModeEnum;
    run?: FlowRun;
    instance?: Instance;
    appConnections: AppConnection[];
  }>()
);

export const BuilderActions = {
  loadInitial,
};
