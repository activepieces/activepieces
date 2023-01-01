import {
	defaultCronJobForScheduleTrigger,
	getDefaultDisplayNameForPiece,
	getDisplayNameForTrigger,
} from 'src/app/modules/common/utils';
import { Store } from '@ngrx/store';
import { forkJoin, map, Observable, take, tap } from 'rxjs';
import { FlowItemDetails } from './step-type-item/flow-item-details';
import { FlowsActions } from '../../../../store/action/flows.action';
import { RightSideBarType } from '../../../../../common/model/enum/right-side-bar-type.enum';
import { Component, Input, OnInit } from '@angular/core';
import { BuilderSelectors } from 'src/app/modules/flow-builder/store/selector/flow-builder.selector';
import { ComponentItemDetails } from './step-type-item/component-item-details';
import { environment } from '../../../../../../../environments/environment';
import { StoreOperation, Trigger, ActionType, TriggerType, Flow, AddActionRequest, FlowVersion } from 'shared';
import { CodeService } from 'src/app/modules/flow-builder/service/code.service';
import { FlowStructureUtil } from 'src/app/modules/flow-builder/service/flowStructureUtil';

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
				displayName: 'Apps',
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
		this.flowTypeSelected$ = forkJoin([
			this.store.select(BuilderSelectors.selectCurrentFlow).pipe(take(1)),
			this.store.select(BuilderSelectors.selectCurrentRightSideBar).pipe(take(1)),
		]).pipe(
			take(1),
			tap(results => {
				if (results[0] == undefined) {
					return;
				}
				if (this._showTriggers) {
					this.replaceTrigger(flowItemDetails);
				} else {
					const action = this.constructAction(
						results[1].props.stepName,
						results[0].version!,
						flowItemDetails.type as ActionType,
						flowItemDetails
					);
					this.store.dispatch(
						FlowsActions.addAction({
							operation: action,
						})
					);
				}
			}),
			map(results => {
				return results[0];
			})
		);
	}

	private replaceTrigger(triggerDetails: FlowItemDetails) {
		let base = {
			name: 'trigger',
			nextAction: undefined,
			displayName: getDisplayNameForTrigger(triggerDetails.type as TriggerType),
		};
		let trigger: Trigger;
		switch (triggerDetails.type as TriggerType) {
			case TriggerType.EMPTY:
				trigger = {
					...base,
					valid: false,
					type: TriggerType.EMPTY,
					settings: {},
				};
				break;
			case TriggerType.SCHEDULE:
				trigger = {
					...base,
					valid: true,
					type: TriggerType.SCHEDULE,
					settings: {
						cronExpression: defaultCronJobForScheduleTrigger,
					},
				};
				break;
			case TriggerType.WEBHOOK:
				trigger = {
					...base,
					valid: true,
					type: TriggerType.WEBHOOK,
					settings: {},
				};
				break;
			case TriggerType.PIECE:
				trigger = {
					...base,
					type: TriggerType.PIECE,
					valid: false,
					settings: {
						pieceName: triggerDetails.name,
						triggerName: '',
						input: {},
					},
				};
				break;
		}
		this.store.dispatch(
			FlowsActions.updateTrigger({
				operation: trigger,
			})
		);
	}

	constructAction(
		parentAction: string,
		flowVersion: FlowVersion,
		actionType: ActionType,
		flowItemDetails: FlowItemDetails
	): AddActionRequest {
		let baseProps = {
			name: FlowStructureUtil.findAvailableName(flowVersion, 'step'),
			displayName: getDefaultDisplayNameForPiece(flowItemDetails.type as ActionType, flowItemDetails.name),
			nextAction: undefined,
			valid: true
		};
		switch (actionType) {
			case ActionType.CODE: {
				return {
					parentAction: parentAction,
					action: {
						...baseProps,
						type: ActionType.CODE,
						settings: {
							artifact: this.codeService.helloWorldBase64(),
							artifactSourceId: undefined,
							artifactPackagedId: undefined,
							input: {},
						},
					},
				};
			}
			case ActionType.LOOP_ON_ITEMS: {
				return {
					parentAction: parentAction,
					action: {
						...baseProps,
						type: ActionType.LOOP_ON_ITEMS,
						settings: {
							items: '',
						},
					},
				};
			}
			case ActionType.STORAGE: {
				return {
					parentAction: parentAction,
					action: {
						...baseProps,
						type: ActionType.STORAGE,
						settings: {
							operation: StoreOperation.GET,
							key: '',
						},
					},
				};
			}
			case ActionType.PIECE: {
				const componentDetails = flowItemDetails as ComponentItemDetails;
				return {
					parentAction: parentAction,
					action: {
						...baseProps,
						type: ActionType.PIECE,
						settings: {
							pieceName: componentDetails.name,
							actionName: undefined,
							input: {},
						},
					},
				};
			}
		}
	}
}
