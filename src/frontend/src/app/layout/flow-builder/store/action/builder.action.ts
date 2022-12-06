import { createAction, props } from '@ngrx/store';
import { Collection } from '../../../common-layout/model/collection.interface';
import { Flow } from '../../../common-layout/model/flow.class';
import { ViewModeEnum } from '../model/enums/view-mode.enum';
import { InstanceRun } from '../../../common-layout/model/instance-run.interface';

export enum BuilderActionType {
	LOAD_INITIAL = '[BUILDER] LOAD_INITIAL',
}

export const loadInitial = createAction(
	BuilderActionType.LOAD_INITIAL,
	props<{ collection: Collection; flows: Flow[]; viewMode: ViewModeEnum; run: InstanceRun | undefined }>()
);

export const BuilderActions = {
	loadInitial,
};
