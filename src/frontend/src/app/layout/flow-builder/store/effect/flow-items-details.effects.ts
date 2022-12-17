import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { ConnectorComponent } from 'src/app/layout/common-layout/components/configs-form/connector-action-or-config';
import { ActionType } from 'src/app/layout/common-layout/model/enum/action-type.enum';
import { TriggerType } from 'src/app/layout/common-layout/model/enum/trigger-type.enum';
import { FlowItemDetails } from '../../page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';
import { ActionMetaService } from '../../service/action-meta.service';
import { FlowItemDetailsActions } from '../action/flow-items-details.action';

@Injectable()
export class FlowItemsDetailsEffects {
	load$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(FlowItemDetailsActions.loadFlowItemsDetails),
			switchMap(() => {
				const components$ = this.flowItemsDetailsService.connectorComponents();
				const coreTriggersFlowItemsDetails$ = of(this.flowItemsDetailsService.triggerItemsDetails);
				const connectorComponentsTriggersFlowItemDetails$ = components$.pipe(
					map(this.createFlowItemDetailsForComponents(true))
				);

				const connectorComponentsActions$ = components$.pipe(map(this.createFlowItemDetailsForComponents(false)));
				const coreFlowItemsDetails$ = of(this.flowItemsDetailsService.coreFlowItemsDetails);
				return forkJoin({
					coreFlowItemsDetails: coreFlowItemsDetails$,
					coreTriggerFlowItemsDetails: coreTriggersFlowItemsDetails$,
					connectorComponentsActionsFlowItemDetails: connectorComponentsActions$,
					connectorComponentsTriggersFlowItemDetails: connectorComponentsTriggersFlowItemDetails$,
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
	createFlowItemDetailsForComponents(forTriggers: boolean) {
		return (components: ConnectorComponent[]) => {
			return components
				.map(c => {

					if (Object.keys(c.actions).length > 0 && !forTriggers) {
						return new FlowItemDetails(
							ActionType.COMPONENT,
							c.name,
							`Connect to ${c.name} and use its api to make requests`,
							c.logoUrl
						);
					} else if (Object.keys(c.triggers).length > 0 && forTriggers) {
						return new FlowItemDetails(
							TriggerType.COMPONENT,
							c.name,
							`Trigger this flow following a specific event on ${c.name}`,
							c.logoUrl
						);
					} else {
						return null;
					}
				})
				.filter(res => res !== null) as FlowItemDetails[];
		};
	}
	constructor(private actions$: Actions, private flowItemsDetailsService: ActionMetaService) {}
}
