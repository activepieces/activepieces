import {
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { distinctUntilChanged, map, Observable, switchMap, take } from 'rxjs';
import { UUID } from 'angular2-uuid';
import { Store } from '@ngrx/store';
import { CdkDragMove } from '@angular/cdk/drag-drop';
import { FlowRunStatus, FlowRun, StepOutput } from '@activepieces/shared';
import {
  BuilderSelectors,
  LeftSideBarType,
  StepRunResult,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-run-details',
  templateUrl: './run-details.component.html',
  styleUrls: ['./run-details.component.scss'],
})
export class RunDetailsComponent implements OnInit {
  readonly FlowRunStatus = FlowRunStatus;
  @ViewChild('stepsResultsAccordion', { read: ElementRef })
  stepsResultsAccordion: ElementRef<HTMLDivElement>;
  @ViewChild('selectedStepResultContainer', { read: ElementRef })
  selectedStepResultContainer: ElementRef<HTMLDivElement>;
  runResults: StepRunResult[] = [];
  selectedRun$: Observable<FlowRun | undefined>;
  private accordionRect: DOMRect = {
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0,
    toJSON: () => '',
  };

  resizerKnobIsBeingDragged = false;
  flowId: UUID;
  logs$: Observable<
    | {
        selectedRun: FlowRun | undefined;
        runResults: StepRunResult[];
      }
    | undefined
    | null
  >;
  currentStepResult$: Observable<StepOutput | undefined>;
  selectedStepName$: Observable<string | null>;
  selectedStepDisplayName$: Observable<string>;
  constructor(
    private store: Store,
    private ngZone: NgZone,
    private renderer2: Renderer2
  ) {
    this.currentStepResult$ = this.store.select(
      BuilderSelectors.selectCurrentStepOutput
    );
  }

  ngOnInit(): void {
    this.selectedStepDisplayName$ = this.store.select(
      BuilderSelectors.selectCurrentStepDisplayName
    );
    this.selectedStepName$ = this.store.select(
      BuilderSelectors.selectCurrentStepName
    );
    this.selectedRun$ = this.store.select(
      BuilderSelectors.selectCurrentFlowRun
    );
    this.logs$ = this.selectedRun$.pipe(
      distinctUntilChanged((prev, curr) => {
        return JSON.stringify(prev) === JSON.stringify(curr);
      }),
      switchMap((flowRun) => {
        return this.store
          .select(BuilderSelectors.selectStepResultsAccordion)
          .pipe(
            take(1),
            map((results) => {
              this.runResults = results;
              return {
                selectedRun: flowRun,
                runResults: this.runResults,
              };
            })
          );
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
      canvasActions.setLeftSidebar({
        sidebarType: LeftSideBarType.NONE,
      })
    );
  }

  resizerDragStarted(stepsResultsAccordion: HTMLElement) {
    this.resizerKnobIsBeingDragged = true;
    this.accordionRect = stepsResultsAccordion.getBoundingClientRect();
  }
  resizerDragged(dragMoveEvent: Pick<CdkDragMove, 'distance'>) {
    const height = this.accordionRect.height + dragMoveEvent.distance.y;
    this.ngZone.runOutsideAngular(() => {
      this.renderer2.setStyle(
        this.stepsResultsAccordion.nativeElement,
        'height',
        `${height}px`
      );
      this.renderer2.setStyle(
        this.selectedStepResultContainer.nativeElement,
        'max-height',
        `calc(100% - ${height}px - 5px)`
      );
    });
  }
  resizerDragStopped() {
    this.resizerKnobIsBeingDragged = false;
  }
  @HostListener('window:resize', ['$event'])
  onResize() {
    //resets to initial state
    this.ngZone.runOutsideAngular(() => {
      if (this.stepsResultsAccordion) {
        this.renderer2.setStyle(
          this.stepsResultsAccordion?.nativeElement,
          'height',
          `calc(50% - 1.8125rem)`
        );
      }
      if (this.selectedStepResultContainer) {
        this.renderer2.setStyle(
          this.selectedStepResultContainer?.nativeElement,
          'max-height',
          `calc(50% - 1.8125rem)`
        );
      }
    });
  }
}
