import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { forkJoin, of, switchMap } from 'rxjs';
import { ActionMetaService } from '../../service/action-meta.service';
import { FlowItemDetailsActions } from '../action/flow-items-details.action';

@Injectable()
export class FlowItemsDetailsEffects {
	load$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(FlowItemDetailsActions.loadFlowItemsDetails),
			switchMap(() => {
				const triggerFlowItemsDetails$ = of(this.flowItemsDetailsService.triggerItemsDetails);
				const connectorComponents$ = this.flowItemsDetailsService.getConnectorsComponents();
				const coreFlowItemsDetails$ = of(this.flowItemsDetailsService.coreFlowItemsDetails);
				return forkJoin({
					coreFlowItemsDetails: coreFlowItemsDetails$,
					triggerFlowItemsDetails: triggerFlowItemsDetails$,
					connectorComponentsFlowItemDetails: connectorComponents$,
				});
			}),
			switchMap(res => {
				return of(
					FlowItemDetailsActions.flowItemsDetailsLoadedSuccessfully({
						flowItemsDetailsLoaded: { ...res, loaded: true },
					})
				);
			})
		);
	});

	constructor(private actions$: Actions, private flowItemsDetailsService: ActionMetaService) {}
}
