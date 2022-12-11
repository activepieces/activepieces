import { Component, NgZone, OnInit } from '@angular/core';
import { distinctUntilChanged, map, Observable } from 'rxjs';
import { InstanceRunStatus } from '../../../../../common-layout/model/enum/instance-run-status';
import { UUID } from 'angular2-uuid';
import { ActionStatus } from '../../../../../common-layout/model/enum/action-status';
import { InstanceRun, StepResult } from '../../../../../common-layout/model/instance-run.interface';
import { TimeHelperService } from '../../../../../common-layout/service/time-helper.service';
import { LeftSideBarType } from 'src/app/layout/common-layout/model/enum/left-side-bar-type.enum';
import { BuilderSelectors } from '../../../../store/selector/flow-builder.selector';
import { Store } from '@ngrx/store';
import { RunDetailsService } from './iteration-details.service';
import { FlowsActions } from 'src/app/layout/flow-builder/store/action/flows.action';
import { CdkDragMove } from '@angular/cdk/drag-drop';

@Component({
	selector: 'app-run-details',
	templateUrl: './run-details.component.html',
	styleUrls: ['./run-details.component.scss'],
})
export class RunDetailsComponent implements OnInit {
	runResults: {
		result: StepResult;
		stepName: string;
	}[] = [];
	accordionRect: DOMRect;
	resizerKnobIsBeingDragged = false;
	flowId: UUID;
	logs$: Observable<
		| {
				selectedRun: InstanceRun | undefined;
				runResults: {
					result: StepResult;
					stepName: string;
				}[];
		  }
		| undefined
		| null
	>;
	selectedStepName$: Observable<string | null>;
	constructor(
		private store: Store,
		public timeHelperService: TimeHelperService,
		public runDetailsService: RunDetailsService,
		private ngZone: NgZone
	) {}

	ngOnInit(): void {
		this.selectedStepName$ = this.store.select(BuilderSelectors.selectCurrentStepName);
		const run$ = this.store.select(BuilderSelectors.selectCurrentFlowRun);
		this.logs$ = run$.pipe(
			distinctUntilChanged((prev, curr) => {
				return prev?.id === curr?.id && prev?.status === curr?.status && prev?.logs_file_id === curr?.logs_file_id;
			}),
			map(selectedFlowRun => {
				if (selectedFlowRun && selectedFlowRun.status !== InstanceRunStatus.RUNNING && selectedFlowRun.logs_file_id) {
					this.runResults = this.createStepResultsForDetailsAccordion(selectedFlowRun);
					return {
						selectedRun: selectedFlowRun,
						runResults: this.runResults,
					};
				}
				this.runResults = [];
				return undefined;
			})
		);
	}

	copyStepResultAndFormatDuration(stepResult: StepResult) {
		const copiedStep: StepResult = JSON.parse(JSON.stringify(stepResult));
		copiedStep.duration = this.formatStepDuration(copiedStep.duration);
		return copiedStep;
	}
	formatStepDuration(duration: number) {
		const durationInSeconds = (duration /= 1000);
		const durationFloatingPointFixed = durationInSeconds.toFixed(3);
		return Number.parseFloat(durationFloatingPointFixed);
	}

	closeLeftSideBar() {
		this.store.dispatch(
			FlowsActions.setLeftSidebar({
				sidebarType: LeftSideBarType.NONE,
			})
		);
	}

	public get actionStatusEnum() {
		return ActionStatus;
	}

	public get InstanceRunStatus() {
		return InstanceRunStatus;
	}

	createStepResultsForDetailsAccordion(run: InstanceRun): {
		result: StepResult;
		stepName: string;
	}[] {
		const stepNames = Object.keys(run.state!.steps);
		return stepNames.map(name => {
			const result = run.state!.steps[name];
			return {
				result: result,
				stepName: name,
			};
		});
	}
	resizerDragStarted(stepsResultsAccordion: HTMLElement) {
		this.resizerKnobIsBeingDragged = true;
		this.accordionRect = stepsResultsAccordion.getBoundingClientRect();
	}
	resizerDragged(
		dragMoveEvent: CdkDragMove,
		stepsResultsAccordion: HTMLElement,
		selectedStepResultContainer: HTMLElement
	) {
		const height = this.accordionRect.height + dragMoveEvent.distance.y;
		this.ngZone.runOutsideAngular(() => {
			stepsResultsAccordion.style.height = `${height}px`;
			selectedStepResultContainer.style.maxHeight = `calc(100% - ${height}px - 20px)`;
		});
	}
	resizerDragStopped() {
		this.resizerKnobIsBeingDragged = false;
	}
}
