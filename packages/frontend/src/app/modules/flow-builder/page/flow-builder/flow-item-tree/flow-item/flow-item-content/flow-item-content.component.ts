import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ThemeService } from '../../../../../../common/service/theme.service';
import { filter, map, Observable, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { FlowItem } from '../../../../../../common/model/flow-builder/flow-item';
import { RightSideBarType } from '../../../../../../common/model/enum/right-side-bar-type.enum';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../../../../store/builder/builder.selector';
import { FlowsActions } from '../../../../../store/flow/flows.action';
import { FlowItemDetails } from '../../../flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';
import { fadeIn400ms } from 'src/app/modules/common/animation/fade-in.animations';
import { RunDetailsService } from '../../../flow-left-sidebar/run-details/iteration-details.service';
import { DeleteStepDialogComponent } from './delete-step-dialog/delete-step-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ExecutionOutputStatus, FlowRun, StepOutput, StepOutputStatus, TriggerType } from 'shared';

@Component({
	selector: 'app-flow-item-content',
	templateUrl: './flow-item-content.component.html',
	styleUrls: ['./flow-item-content.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [fadeIn400ms],
})
export class FlowItemContentComponent implements OnInit {
	//in case it is not reached, we return undefined
	stepStatus$: Observable<StepOutputStatus | undefined>;
	stepInsideLoopStatus$: Observable<StepOutputStatus | undefined>;
	hover = false;
	flowItemChanged$: Subject<boolean> = new Subject();
	stepIconUrl: string;
	_flowItem: FlowItem;
	selectedRun$: Observable<FlowRun | undefined>;
	@Input() selected: boolean;
	@Input() trigger = false;
	@Input() viewMode: boolean;
	@Input() set flowItem(newFlowItem: FlowItem) {
		this._flowItem = newFlowItem;
		this.flowItemChanged$.next(true);
		this.fetchFlowItemDetailsAndLoadLogo();
		this.cd.detectChanges();
	}

	stepResult: StepOutput | undefined;
	flowItemDetails$: Observable<FlowItemDetails | null | undefined>;
	constructor(
		public themeService: ThemeService,
		private store: Store,
		private cd: ChangeDetectorRef,
		private runDetailsService: RunDetailsService,
		private dialogService: MatDialog
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

	getStepStatusIfItsNotInsideLoop(): Observable<StepOutputStatus | undefined> {
		return this.selectedRun$.pipe(
			map(selectedRun => {
				if (selectedRun) {
					if (selectedRun.status !== ExecutionOutputStatus.RUNNING && selectedRun.executionOutput?.executionState) {
						const stepName = this._flowItem.name;
						const result = selectedRun.executionOutput?.executionState.steps[stepName.toString()];
						if (result) {
							this.stepResult = result;
						}
						return result === undefined ? undefined : result.status;
					} else {
						return StepOutputStatus.RUNNING;
					}
				}
				return undefined;
			})
		);
	}

	deleteStep() {
		const stepName = this._flowItem.name;
		if (stepName == undefined) {
			return;
		}
		this.dialogService.open(DeleteStepDialogComponent, { data: stepName });
	}

	get actionStatusEnum() {
		return StepOutputStatus;
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
			FlowsActions.selectStepByName({
				stepName: this._flowItem.name,
			})
		);
		this.runDetailsService.currentStepResult$.next({ stepName: this._flowItem.name, result: this.stepResult });
	}
}
