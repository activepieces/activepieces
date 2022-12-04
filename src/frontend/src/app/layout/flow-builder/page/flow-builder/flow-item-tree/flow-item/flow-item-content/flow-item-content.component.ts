import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ThemeService } from '../../../../../../common-layout/service/theme.service';
import { TriggerType } from '../../../../../../common-layout/model/enum/trigger-type.enum';
import { ActionStatus } from '../../../../../../common-layout/model/enum/action-status';
import { InstanceRunStatus } from '../../../../../../common-layout/model/enum/instance-run-status';
import { filter, map, Observable, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs';

import { ConfirmDeleteModalComponent } from '../../../../../../common-layout/components/confirm-delete-modal/confirm-delete-modal.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { FlowItem } from '../../../../../../common-layout/model/flow-builder/flow-item';
import { RightSideBarType } from '../../../../../../common-layout/model/enum/right-side-bar-type.enum';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../../../../store/selector/flow-builder.selector';
import { FlowsActions } from '../../../../../store/action/flows.action';
import { FlowItemDetails } from '../../../flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';
import { FlowItemDetailsActions } from 'src/app/layout/flow-builder/store/action/flow-items-details.action';
import { ActionType } from 'src/app/layout/common-layout/model/enum/action-type.enum';
import { RemoteFlowAction } from 'src/app/layout/common-layout/model/flow-builder/actions/remote-flow-action.interface';
import { fadeIn400ms } from 'src/app/layout/common-layout/animation/fade-in.animations';
import { RunDetailsService } from '../../../flow-left-sidebar/run-details/iteration-details.service';
import { InstanceRun, StepResult } from 'src/app/layout/common-layout/model/instance-run.interface';

@Component({
	selector: 'app-flow-item-content',
	templateUrl: './flow-item-content.component.html',
	styleUrls: ['./flow-item-content.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [fadeIn400ms],
})
export class FlowItemContentComponent implements OnInit {
	bsModalRef: BsModalRef;
	//in case it is not reached, we return undefined
	stepStatus$: Observable<ActionStatus | undefined>;
	stepInsideLoopStatus$: Observable<ActionStatus | undefined>;
	hover = false;
	flowItemChanged$: Subject<boolean> = new Subject();
	stepIconUrl: string;
	_flowItem: FlowItem;
	selectedRun$: Observable<InstanceRun | undefined>;
	@Input() selected: boolean;
	@Input() trigger = false;
	@Input() viewMode: boolean;
	@Input() set flowItem(newFlowItem: FlowItem) {
		this._flowItem = newFlowItem;
		this.flowItemChanged$.next(true);
		this.fetchFlowItemDetailsAndLoadLogo();
		this.cd.detectChanges();
	}

	stepResult: StepResult | undefined;
	flowItemDetails$: Observable<FlowItemDetails | null | undefined>;
	constructor(
		public themeService: ThemeService,
		private store: Store,
		private bsModalService: BsModalService,
		private cd: ChangeDetectorRef,
		private runDetailsService: RunDetailsService
	) {}

	ngOnInit(): void {
		this.selectedRun$ = this.store.select(BuilderSelectors.selectCurrentFlowRun);
		this.stepStatus$ = this.getStepStatusIfItsNotInsideLoop();
		this.stepInsideLoopStatus$ = this.runDetailsService.iterationStepResultState$.pipe(
			filter(stepNameAndStatus => {
				return stepNameAndStatus.stepName === this._flowItem.name;
			}),
			map(stepNameAndStatus => {
				this.stepResult = stepNameAndStatus.result;
				return stepNameAndStatus.result?.status;
			})
		);
		this.fetchFlowItemDetailsAndLoadLogo();
	}

	private fetchFlowItemDetailsAndLoadLogo() {
		this.flowItemDetails$ = this.store.select(BuilderSelectors.selectAllFlowItemsDetailsLoadedState).pipe(
			takeUntil(this.flowItemChanged$),
			switchMap(loaded => {
				if (loaded) {
					return this.store.select(BuilderSelectors.selectFlowItemDetails(this._flowItem)).pipe(
						tap(flowItemDetails => {
							if (flowItemDetails) {
								const itemIcon = new Image();
								itemIcon.src = flowItemDetails.logoUrl!;
								itemIcon.onload = () => {
									this.stepIconUrl = flowItemDetails.logoUrl!;
									this.cd.detectChanges();
								};
							} else if (this._flowItem.type === ActionType.REMOTE_FLOW) {
								const remoteFlowItem: RemoteFlowAction = this._flowItem as RemoteFlowAction;
								this.store.dispatch(
									FlowItemDetailsActions.loadOldRemoteFlowItemDetails({
										collectionVersionId: remoteFlowItem.settings.pieceVersionId,
									})
								);
							} else {
								console.error(`Flow item has no details:${this._flowItem.name}`);
							}
						})
					);
				}
				return of(null);
			})
		);
	}

	getStepStatusIfItsNotInsideLoop(): Observable<ActionStatus | undefined> {
		return this.selectedRun$.pipe(
			map(selectedRun => {
				if (selectedRun) {
					if (selectedRun.status !== InstanceRunStatus.RUNNING) {
						const stepName = this._flowItem.name;
						const result = selectedRun.state.steps[stepName.toString()];
						if (result) {
							this.stepResult = result;
						}
						return result === undefined ? undefined : result.status;
					} else {
						return ActionStatus.RUNNING;
					}
				}
				return undefined;
			})
		);
	}

	trashIconSvgStyle() {
		return {
			width: '14px',
			height: '14px',
			fill: this.hover ? this.themeService.DANGER_COLOR : this.themeService.BODY_COLOR,
		};
	}

	deleteStep() {
		const stepName = this._flowItem.name;
		if (stepName == undefined) {
			return;
		}
		this.bsModalRef = this.bsModalService.show(ConfirmDeleteModalComponent, {
			initialState: {
				archive: false,
				entityName: stepName,
				showText: false,
				instantClose: false,
			},
		});
		this.bsModalRef.content.confirmState.pipe(take(1)).subscribe(confirm => {
			if (confirm && stepName) {
				this.store.dispatch(
					FlowsActions.deleteStep({
						stepName: stepName,
					})
				);
				this.bsModalRef.hide();
			}
		});
	}

	get actionStatusEnum() {
		return ActionStatus;
	}

	get triggerType() {
		return TriggerType;
	}

	changeTrigger() {
		this.store.dispatch(
			FlowsActions.setRightSidebar({
				sidebarType: RightSideBarType.TRIGGER_TYPE,
				props: {},
			})
		);
	}
	selectStep() {
		this.store.dispatch(
			FlowsActions.selectStep({
				step: this._flowItem,
			})
		);
		this.runDetailsService.currentStepResult$.next({ stepName: this._flowItem.name, result: this.stepResult });
	}
}
