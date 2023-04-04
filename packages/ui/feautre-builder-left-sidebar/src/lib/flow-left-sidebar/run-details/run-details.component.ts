import { Component, NgZone, OnInit } from '@angular/core';
import { distinctUntilChanged, map, Observable } from 'rxjs';
import { UUID } from 'angular2-uuid';
import { Store } from '@ngrx/store';
import { RunDetailsService } from './iteration-details.service';
import { CdkDragMove } from '@angular/cdk/drag-drop';
import {
  ExecutionOutputStatus,
  FlowRun,
  StepOutput,
  StepOutputStatus,
} from '@activepieces/shared';
import { BuilderSelectors, FlowsActions, LeftSideBarType } from '@activepieces/ui/feature-builder-store';


@Component({
  selector: 'app-run-details',
  templateUrl: './run-details.component.html',
  styleUrls: ['./run-details.component.scss'],
})
export class RunDetailsComponent implements OnInit {
  runResults: {
    result: StepOutput;
    stepName: string;
  }[] = [];
  accordionRect: DOMRect;
  resizerKnobIsBeingDragged = false;
  flowId: UUID;
  logs$: Observable<
    | {
        selectedRun: FlowRun | undefined;
        runResults: {
          result: StepOutput;
          stepName: string;
        }[];
      }
    | undefined
    | null
  >;
  selectedStepName$: Observable<string | null>;
  constructor(
    private store: Store,
    public runDetailsService: RunDetailsService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.selectedStepName$ = this.store.select(
      BuilderSelectors.selectCurrentStepName
    );
    const run$ = this.store.select(BuilderSelectors.selectCurrentFlowRun);
    this.logs$ = run$.pipe(
      distinctUntilChanged((prev, curr) => {
        return (
          prev?.id === curr?.id &&
          prev?.status === curr?.status &&
          prev?.logsFileId === curr?.logsFileId
        );
      }),
      map((selectedFlowRun) => {
        if (
          selectedFlowRun &&
          selectedFlowRun.status !== ExecutionOutputStatus.RUNNING &&
          selectedFlowRun.logsFileId
        ) {
          this.runResults =
            this.createStepResultsForDetailsAccordion(selectedFlowRun);
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

  copyStepResultAndFormatDuration(stepResult: StepOutput) {
    const copiedStep: StepOutput = JSON.parse(JSON.stringify(stepResult));
    copiedStep.duration = this.formatStepDuration(copiedStep.duration!);
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
    return StepOutputStatus;
  }

  public get InstanceRunStatus() {
    return ExecutionOutputStatus;
  }

  createStepResultsForDetailsAccordion(run: FlowRun): {
    result: StepOutput;
    stepName: string;
  }[] {
    const stepNames = Object.keys(run.executionOutput!.executionState.steps);
    return stepNames.map((name) => {
      const result = run.executionOutput!.executionState.steps[name];
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
