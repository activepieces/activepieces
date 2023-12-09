import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatExpansionPanel } from '@angular/material/expansion';
import { Store } from '@ngrx/store';
import {
  BuilderSelectors,
  StepRunResult,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';
import { map, Observable, startWith, tap } from 'rxjs';
import { RunDetailsService } from '../iteration-details.service';
import {
  LoopStepOutput,
  StepOutput,
  StepOutputStatus,
} from '@activepieces/shared';
import { fadeInAnimation } from '@activepieces/ui/common';

@Component({
  selector: 'app-step-result',
  templateUrl: './step-result.component.html',
  styleUrls: ['./step-result.component.scss'],
  animations: [fadeInAnimation(400, false)],
})
export class StepResultComponent implements OnInit, AfterViewInit {
  @Input() stepResult: StepRunResult;
  @Input() set selectedStepName(stepName: string | null) {
    this._selectedStepName = stepName;

    if (this._selectedStepName === this.stepResult.stepName) {
      this.runDetailsService.hideAllIterationsInput$.next(true);
      this.childStepSelected.emit();
    }
  }
  @Input() nestingLevel = 0;
  @Input() isTrigger = false;
  @Output() childStepSelected = new EventEmitter();
  stepLogoUrl$: Observable<string | undefined>;
  isLoopStep = false;
  nestingLevelPadding = '0px';
  finishedBuilding = false;
  iterationIndexControl = new UntypedFormControl(1);
  iteration$: Observable<Pick<StepRunResult, 'stepName' | 'output'>[]>;
  iterationsAccordionList: Pick<StepRunResult, 'stepName' | 'output'>[][] = [];
  previousIterationIndex = 0;
  hideIterationInput$: Observable<boolean>;
  showIterationInput = false;
  iterationInputMinWidth = '0px';
  _selectedStepName: string | null = '';
  constructor(
    private store: Store,
    private runDetailsService: RunDetailsService
  ) {
    this.hideIterationInput$ =
      this.runDetailsService.hideAllIterationsInput$.pipe(
        tap(() => {
          this.showIterationInput = false;
        })
      );
  }

  ngOnInit(): void {
    this.nestingLevelPadding = `${this.nestingLevel * 25}px`;
    this.stepLogoUrl$ = this.store.select(
      BuilderSelectors.selectStepLogoUrl(this.stepResult.stepName)
    );
    const stepOutput = this.stepResult.output?.output as any;
    if (stepOutput?.iterations !== undefined) {
      this.isLoopStep = true;
      const loopOutput = this.stepResult.output as LoopStepOutput;
      loopOutput.output?.iterations.forEach((iteration) => {
        this.iterationsAccordionList.push(
          this.createStepResultsForDetailsAccordion(iteration)
        );
      });
      this.iteration$ = this.iterationIndexControl.valueChanges.pipe(
        startWith(1),
        tap((newIndex: number | null) => {
          this.setInputMinWidth(newIndex);
        }),
        map((newIndex: number | null) => {
          return this.minMaxIterationIndex(newIndex);
        }),
        tap((newIndex) => {
          this.iterationIndexControl.setValue(newIndex, { emitEvent: false });
        }),
        map((newIndex: number) => {
          if (!newIndex) {
            return this.iterationsAccordionList[0] || [];
          }
          const iteration = this.iterationsAccordionList[newIndex - 1];
          return iteration || [];
        }),
        tap((iteration) => {
          const previousIteration =
            this.iterationsAccordionList[this.previousIterationIndex];
          previousIteration?.forEach((st) => {
            this.clearStepsThatWereNotReached(st);
          });
          this.findCurrentStepResultInCurrentIteration(iteration);
          this.previousIterationIndex = this.iterationIndexControl.value - 1;
        })
      );
    }

    if (this._selectedStepName === this.stepResult.stepName) {
      this.childStepSelected.emit();
      this.runDetailsService.currentStepResult$.next(this.stepResult);
    }
  }

  private findCurrentStepResultInCurrentIteration(
    iteration: Pick<StepRunResult, 'stepName' | 'output'>[]
  ) {
    iteration.forEach((st) => {
      const stepNameAndResult = {
        stepName: st.stepName,
        output: st.output,
      };
      this.runDetailsService.iterationStepResultState$.next(stepNameAndResult);
      if (
        st.stepName ===
        this.runDetailsService.currentStepResult$.value?.stepName
      ) {
        this.runDetailsService.currentStepResult$.next(stepNameAndResult);
      }
    });
  }
  private minMaxIterationIndex(newIndex: number | null) {
    const stepOutput = this.stepResult.output?.output as any;
    if (newIndex === null || newIndex < 1) {
      return 1;
    } else if (
      stepOutput.iterations &&
      newIndex > stepOutput.iterations.length
    ) {
      return stepOutput.iterations!.length;
    }
    return newIndex;
  }
  private setInputMinWidth(newIndex: number | null) {
    if (newIndex) {
      this.iterationInputMinWidth = `${newIndex.toString().length * 2.2}ch`;
    } else {
      this.iterationInputMinWidth = '0ch';
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.finishedBuilding = true;
    }, 1);
  }

  get ActionStatus() {
    return StepOutputStatus;
  }

  selectStepOrToggleExpansionPanel(
    $event: MouseEvent,
    expansionPanel: MatExpansionPanel
  ) {
    if (this._selectedStepName !== this.stepResult.stepName) {
      this.store.dispatch(
        canvasActions.selectStepByName({
          stepName: this.stepResult.stepName,
        })
      );
      this.runDetailsService.hideAllIterationsInput$.next(true);
      this.childStepSelected.emit();
      this.runDetailsService.currentStepResult$.next(this.stepResult);
    } else if (expansionPanel) {
      expansionPanel.toggle();
    }

    $event.stopPropagation();
  }

  createStepResultsForDetailsAccordion(
    iteration: Record<string, StepOutput>
  ): Pick<StepRunResult, 'stepName' | 'output'>[] {
    const iterationStepsNames = Object.keys(iteration);
    return iterationStepsNames.map((stepName) => {
      return {
        stepName: stepName,
        output: iteration[stepName],
      };
    });
  }

  indexSearchClicked($event: MouseEvent) {
    $event.stopPropagation();
  }

  clearStepsThatWereNotReached(
    stepWithinLoop: Pick<StepRunResult, 'stepName' | 'output'>
  ) {
    this.runDetailsService.iterationStepResultState$.next({
      stepName: stepWithinLoop.stepName,
      output: undefined,
    });
    if (
      stepWithinLoop.stepName ===
      this.runDetailsService.currentStepResult$.value?.stepName
    ) {
      this.runDetailsService.currentStepResult$.next(undefined);
    }
    const stepWithinLoopOutput = stepWithinLoop.output?.output as any;
    if (stepWithinLoopOutput?.iterations) {
      if (stepWithinLoopOutput.iterations[0]) {
        const firstIterationResult = this.createStepResultsForDetailsAccordion(
          stepWithinLoopOutput.iterations[0]
        );
        firstIterationResult.forEach((st) => {
          this.clearStepsThatWereNotReached(st);
        });
      }
    }
  }
  childStepSelectedHandler() {
    this.showIterationInput = true;
    this.childStepSelected.emit();
  }
  doneClicked($event: MouseEvent, iterationInput: HTMLElement) {
    $event.stopPropagation();
    iterationInput.blur();
  }

  get iterationLength(): number {
    const stepOutput = this.stepResult.output?.output as any;
    return stepOutput.iterations ? stepOutput.iterations.length : 0;
  }
}
