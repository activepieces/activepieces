import {
	defaultCronJobForScheduleTrigger,
	getDefaultDisplayNameForPiece,
	getDisplayNameForTrigger,
} from 'src/app/layout/common-layout/utils';
import { Store } from '@ngrx/store';
import { Observable, take, tap } from 'rxjs';
import { FlowItemDetails } from './step-type-item/flow-item-details';
import { FlowsActions } from '../../../../store/action/flows.action';
import { RightSideBarType } from '../../../../../common-layout/model/enum/right-side-bar-type.enum';
import { Trigger } from '../../../../../common-layout/model/flow-builder/trigger/trigger.interface';
import { TriggerType } from '../../../../../common-layout/model/enum/trigger-type.enum';
import { Component, Input, OnInit } from '@angular/core';
import { BuilderSelectors } from 'src/app/layout/flow-builder/store/selector/flow-builder.selector';
import { FlowVersion } from 'src/app/layout/common-layout/model/flow-version.class';
import { ActionType } from 'src/app/layout/common-layout/model/enum/action-type.enum';
import { StorageOperation } from 'src/app/layout/common-layout/model/flow-builder/actions/storage-operation.enum';
import { StorageScope } from 'src/app/layout/common-layout/model/flow-builder/actions/storage-scope.enum';
import { StepCacheKey } from 'src/app/layout/flow-builder/service/artifact-cache-key';
import { Flow } from 'src/app/layout/common-layout/model/flow.class';
import { CodeService } from '../../../../service/code.service';
import { FlowItem } from 'src/app/layout/common-layout/model/flow-builder/flow-item';
import { ComponentItemDetails } from './step-type-item/component-item-details';
import { environment } from '../../../../../../../environments/environment';

@Component({
	selector: 'app-step-type-sidebar',
	templateUrl: './step-type-sidebar.component.html',
	styleUrls: ['./step-type-sidebar.component.scss'],
})
export class StepTypeSidebarComponent implements OnInit {
	_showTriggers = false;
	@Input() set showTriggers(shouldShowTriggers) {
		this._showTriggers = shouldShowTriggers;
		if (this._showTriggers) {
			this.triggersDetails$ = this.store.select(BuilderSelectors.selectFlowItemDetailsForTriggers);
			this.sideBarDisplayName = 'Triggers';
		} else {
			if (this.tabsAndTheirLists.length == 0) {
				this.populateTabsAndTheirLists();
			}
			this.sideBarDisplayName = 'Flow Steps';
		}
	}

	sideBarDisplayName = 'Flow Steps';
	tabsAndTheirLists: {
		displayName: string;
		list$: Observable<FlowItemDetails[]>;
	}[] = [];
	flowTypeSelected$: Observable<Flow | undefined>;
	flowItemDetailsLoaded$: Observable<boolean>;
	triggersDetails$: Observable<FlowItemDetails[]>;
	constructor(private store: Store, private codeService: CodeService) {}

	ngOnInit(): void {
		this.flowItemDetailsLoaded$ = this.store
			.select(BuilderSelectors.selectAllFlowItemsDetailsLoadedState)
			.pipe(tap(console.log));
	}

	populateTabsAndTheirLists() {
		const coreItemsDetails$ = this.store.select(BuilderSelectors.selectCoreFlowItemsDetails);
		const connectersItemsDetails$ = this.store.select(BuilderSelectors.selectFlowItemsDetailsForConnectors);
		const userCollectionsItemsDetails$ = this.store.select(BuilderSelectors.selectFlowItemsDetialsForUserCollections);
		const connectorComponentsItemsDetails$ = this.store.select(
			BuilderSelectors.selectFlowItemDetailsForConnectorComponents
		);
		this.tabsAndTheirLists.push({
			displayName: 'Core',
			list$: coreItemsDetails$,
		});
		this.tabsAndTheirLists.push({
			displayName: 'Apps',
			list$: connectersItemsDetails$,
		});
		this.tabsAndTheirLists.push({
			displayName: 'My Collections',
			list$: userCollectionsItemsDetails$,
		});
		console.log(environment.feature);
		if (environment.feature.newComponents) {
			this.tabsAndTheirLists.push({
				displayName: 'Components',
				list$: connectorComponentsItemsDetails$,
			});
		}
	}

	closeSidebar() {
		this.replaceTrigger;
		this.store.dispatch(
			FlowsActions.setRightSidebar({
				sidebarType: RightSideBarType.NONE,
				props: {},
			})
		);
	}

	onTypeSelected(flowItemDetails: FlowItemDetails) {
		this.flowTypeSelected$ = this.store.select(BuilderSelectors.selectCurrentFlow).pipe(
			take(1),
			tap(flow => {
				if (flow == undefined) {
					return;
				}
				if (this._showTriggers) {
					this.replaceTrigger(flowItemDetails);
				} else {
					const stepName = FlowVersion.clone(flow.lastVersion).findAvailableName('step');
					const settings: any = this.constructStepSettings(flowItemDetails.type as ActionType, flowItemDetails);
					const action: FlowItem = {
						type: flowItemDetails.type as ActionType,
						name: stepName,
						displayName: getDefaultDisplayNameForPiece(flowItemDetails.type as ActionType, flowItemDetails.name),
						settings: settings,
						valid:
							flowItemDetails.type !== ActionType.STORAGE &&
							flowItemDetails.type !== ActionType.LOOP_ON_ITEMS &&
							flowItemDetails.type !== ActionType.REMOTE_FLOW,
						yOffsetFromLastNode: 0,
					};
					if (flowItemDetails.type === ActionType.CODE) {
						this.codeService.getOrCreateStepArtifact(new StepCacheKey(flow.id, stepName), '');
					}
					this.dispatchAddStep(action);
				}
			})
		);
	}
	dispatchAddStep(action: FlowItem) {
		this.store.dispatch(FlowsActions.addStep({ newAction: action }));
	}

	private replaceTrigger(triggerDetails: FlowItemDetails) {
		const trigger: Trigger = {
			type: triggerDetails.type as TriggerType,
			name: 'trigger',
			displayName: getDisplayNameForTrigger(triggerDetails.type as TriggerType),
			settings: {},
			yOffsetFromLastNode: 0,
			valid: false,
		};
		if (trigger.type == TriggerType.SCHEDULE) {
			trigger.settings.cronExpression = defaultCronJobForScheduleTrigger;
			trigger.valid = true;
		}
		if (trigger.type === TriggerType.INSTANCE_STOPPED) {
			trigger.valid = true;
		}
		if (trigger.type === TriggerType.INSTANCE_STARTED) {
			trigger.valid = true;
		}
		if (trigger.type === TriggerType.WEBHOOK) {
			trigger.valid = true;
		}
		if (trigger.type === TriggerType.MANUAL) {
			trigger.valid = true;
		}
		this.store.dispatch(
			FlowsActions.replaceTrigger({
				newTrigger: trigger,
			})
		);
	}

	// TODO GET RID OF ANY AND MAKE THEM CLASSES :)
	constructStepSettings(actionType: ActionType, flowItemDetails: FlowItemDetails) {
		switch (actionType) {
			case ActionType.REMOTE_FLOW: {
				const flowVersionId =
					flowItemDetails.extra?.flowsVersionIds.length == 0 ? undefined : flowItemDetails.extra?.flowsVersionIds[0];
				return {
					pieceVersionId: flowItemDetails.extra?.pieceVersionId,
					flowVersionId: flowVersionId,
					input: {},
				};
			}
			case ActionType.CODE: {
				return {
					input: {},
				};
			}
			case ActionType.LOOP_ON_ITEMS: {
				return {
					items: '',
				};
			}
			case ActionType.RESPONSE: {
				return {
					output: {},
				};
			}
			case ActionType.STORAGE: {
				return {
					operation: StorageOperation.GET,
					scope: StorageScope.INSTANCE,
					key: '',
				};
			}
			case ActionType.COMPONENT: {
				const componentDetails = flowItemDetails as ComponentItemDetails;
				return {
					componentName: componentDetails.name,
					componentVersion: componentDetails.version,
					manifestUrl: componentDetails.manifestUrl,
				};
			}
		}

		return {};
	}
}
