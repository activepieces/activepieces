import { createAction, props } from '@ngrx/store';
import { Flow } from '../../../common-layout/model/flow.class';
import { ViewModeEnum } from '../model/enums/view-mode.enum';
import { InstanceRun } from '../../../common-layout/model/instance-run.interface';
import { Collection } from 'src/app/layout/common-layout/model/collection.interface';
import { Instance } from 'src/app/layout/common-layout/model/instance.interface';

export enum BuilderActionType {
	LOAD_INITIAL = '[BUILDER] LOAD_INITIAL',
}

export const loadInitial = createAction(
	BuilderActionType.LOAD_INITIAL,
	props<{ collection: Collection; flows: Flow[]; viewMode: ViewModeEnum; run?: InstanceRun; instance?: Instance }>()
);

export const BuilderActions = {
	loadInitial,
};
