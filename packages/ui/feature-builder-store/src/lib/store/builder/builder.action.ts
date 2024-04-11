import { createAction, props } from '@ngrx/store';
import { FlowRun, FlowVersion, PopulatedFlow } from '@activepieces/shared';
import { ViewModeEnum } from '../../model/enums/view-mode.enum';

export enum BuilderActionType {
  LOAD_INITIAL = '[BUILDER] LOAD_INITIAL',
}

export const loadInitial = createAction(
  BuilderActionType.LOAD_INITIAL,
  props<{
    flow: PopulatedFlow;
    viewMode: ViewModeEnum;
    run?: FlowRun;
    publishedVersion?: FlowVersion;
  }>()
);

export const BuilderActions = {
  loadInitial,
};
