import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { forkJoin, map, of, switchMap } from 'rxjs';
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
				const connectorComponents$ = this.flowItemsDetailsService.connectorComponents().pipe(
					map(components => {
						return components.map(c => {
							return new FlowItemDetails(
								ActionType.COMPONENT,
								c.name,
								`Connect to ${c.name} and use its api to make requests`,
								c.logoUrl
							);
						});
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
