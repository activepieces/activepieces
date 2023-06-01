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
import { RunDetailsService } from './iteration-details.service';
import { CdkDragMove } from '@angular/cdk/drag-drop';
import {
  ExecutionOutputStatus,
  FlowRun,
  StepOutput,
  StepOutputStatus,
} from '@activepieces/shared';
import {
  BuilderSelectors,
  LeftSideBarType,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';

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
  selectedRun$: Observable<FlowRun | undefined>;
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
  @ViewChild('stepsResultsAccordion', { read: ElementRef })
  stepsResultsAccordion: ElementRef;
  @ViewChild('selectedStepResultContainer', { read: ElementRef })
  selectedStepResultContainer: ElementRef;
  constructor(
    private store: Store,
    public runDetailsService: RunDetailsService,
    private ngZone: NgZone,
    private renderer2: Renderer2
  ) {}

  ngOnInit(): void {
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

  public get actionStatusEnum() {
    return StepOutputStatus;
  }

  public get InstanceRunStatus() {
    return ExecutionOutputStatus;
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
      this.renderer2.setStyle(
        this.stepsResultsAccordion.nativeElement,
        'height',
        `calc(50% - 29px)`
      );
      this.renderer2.setStyle(
        this.selectedStepResultContainer.nativeElement,
        'max-height',
        `calc(50% - 29px)`
      );
    });
  }
}
