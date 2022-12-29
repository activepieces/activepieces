import {
	defaultCronJobForScheduleTrigger,
	getDefaultDisplayNameForPiece,
	getDisplayNameForTrigger,
} from 'src/app/modules/common/utils';
import { Store } from '@ngrx/store';
import { Observable, take, tap } from 'rxjs';
import { FlowItemDetails } from './step-type-item/flow-item-details';
import { FlowsActions } from '../../../../store/action/flows.action';
import { RightSideBarType } from '../../../../../common/model/enum/right-side-bar-type.enum';
import { Trigger } from '../../../../../common/model/flow-builder/trigger/trigger.interface';
import { TriggerType } from '../../../../../common/model/enum/trigger-type.enum';
import { Component, Input, OnInit } from '@angular/core';
import { BuilderSelectors } from 'src/app/modules/flow-builder/store/selector/flow-builder.selector';
import { FlowVersion } from 'src/app/modules/common/model/flow-version.class';
import { ActionType } from 'src/app/modules/common/model/enum/action-type.enum';
import { StorageOperation } from 'src/app/modules/common/model/flow-builder/actions/storage-operation.enum';
import { StorageScope } from 'src/app/modules/common/model/flow-builder/actions/storage-scope.enum';
import { StepCacheKey } from 'src/app/modules/flow-builder/service/artifact-cache-key';
import { Flow } from 'src/app/modules/common/model/flow.class';
import { CodeService } from '../../../../service/code.service';
import { FlowItem } from 'src/app/modules/common/model/flow-builder/flow-item';
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
			this.sideBarDisplayName = 'Triggers';
		} else {
			this.sideBarDisplayName = 'Flow Steps';
		}
		this.populateTabsAndTheirLists();
	}

	sideBarDisplayName = 'Flow Steps';
	tabsAndTheirLists: {
		displayName: string;
		list$: Observable<FlowItemDetails[]>;
		emptyListText: string;
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
		this.tabsAndTheirLists = [];
		const coreItemsDetails$ = this._showTriggers
			? this.store.select(BuilderSelectors.selectFlowItemDetailsForCoreTriggers)
			: this.store.select(BuilderSelectors.selectCoreFlowItemsDetails);
		const connectorComponentsItemsDetails$ = this._showTriggers
			? this.store.select(BuilderSelectors.selectFlowItemDetailsForConnectorComponentsTriggers)
			: this.store.select(BuilderSelectors.selectFlowItemDetailsForConnectorComponents);
		this.tabsAndTheirLists.push({
			displayName: 'Core',
			list$: coreItemsDetails$,
			emptyListText: '',
		});

		if (environment.feature.newComponents) {
			this.tabsAndTheirLists.push({
				displayName: 'apps',
				list$: connectorComponentsItemsDetails$,
				emptyListText: this._showTriggers ? 'No app triggers are available' : 'No app steps are available',
			});
		}
	}

	closeSidebar() {
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
					const stepName = FlowVersion.clone(flow.last_version).findAvailableName('step');
					const settings: any = this.constructStepSettings(flowItemDetails.type as ActionType, flowItemDetails);
					const action: FlowItem = {
						type: flowItemDetails.type as ActionType,
						name: stepName,
						display_name: getDefaultDisplayNameForPiece(flowItemDetails.type as ActionType, flowItemDetails.name),
						settings: settings,
						valid: flowItemDetails.type !== ActionType.STORAGE && flowItemDetails.type !== ActionType.LOOP_ON_ITEMS,
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
			display_name: getDisplayNameForTrigger(triggerDetails.type as TriggerType),
			settings: {},
			yOffsetFromLastNode: 0,
			valid: false,
		};
		if (trigger.type == TriggerType.SCHEDULE) {
			trigger.settings.cron_expression = defaultCronJobForScheduleTrigger;
			trigger.valid = true;
		}
		if (trigger.type === TriggerType.COLLECTION_DISABLED) {
			trigger.valid = true;
		}
		if (trigger.type === TriggerType.COLLECTION_ENABLED) {
			trigger.valid = true;
		}
		if (trigger.type === TriggerType.WEBHOOK) {
			trigger.valid = true;
		}
		if (trigger.type === TriggerType.COMPONENT) {
			trigger.valid = false;

			trigger.settings.component_name = triggerDetails.name;
			trigger.settings.trigger_name = '';
			trigger.settings.input = {};
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
					scope: StorageScope.COLLECTION,
					key: '',
				};
			}
			case ActionType.COMPONENT: {
				const componentDetails = flowItemDetails as ComponentItemDetails;
				return {
					component_name: componentDetails.name,
				};
			}
		}

		return {};
	}
}
