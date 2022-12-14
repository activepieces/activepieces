import { apps } from '@activepieces/components';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { forkJoin, of, switchMap } from 'rxjs';
import { ActionType } from 'src/app/layout/common-layout/model/enum/action-type.enum';
import { FlowItemDetails } from '../../page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';
import { ActionMetaService } from '../../service/action-meta.service';
import { FlowItemDetailsActions } from '../action/flow-items-details.action';

@Injectable()
export class FlowItemsDetailsEffects {
	load$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(FlowItemDetailsActions.loadFlowItemsDetails),
			switchMap(() => {
				const triggerFlowItemsDetails$ = of(this.flowItemsDetailsService.triggerItemsDetails);
				debugger;
				const connectorComponents$ = of(
					apps.map(app => {
						return new FlowItemDetails(
							ActionType.COMPONENT,
							app.name,
							`Connect to ${app.name} and use its api to make requests`,
							app.logoUrl
						);
					})
				);
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
