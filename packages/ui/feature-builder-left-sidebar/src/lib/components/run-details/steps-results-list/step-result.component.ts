import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatExpansionPanel } from '@angular/material/expansion';
import { Store } from '@ngrx/store';
import {
  BuilderSelectors,
  StepRunResult,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';
import { map, Observable, startWith, switchMap, tap } from 'rxjs';
import { RunDetailsService } from '../iteration-details.service';
import {
  ActionType,
  GenericStepOutput,
  LoopStepResult,
  StepOutput,
  StepOutputStatus,
  assertNotNullOrUndefined,
  flowHelper,
} from '@activepieces/shared';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
import { fadeInAnimation } from '@activepieces/ui/common';

@Component({
  selector: 'app-step-result',
  templateUrl: './step-result.component.html',
  styleUrls: ['./step-result.component.scss'],
  animations: [fadeInAnimation(400, false)],
})
export class StepResultComponent implements OnInit {
  @Input({ required: true }) stepResult: StepRunResult;
  @Input({ required: true }) set selectedStepName(stepName: string | null) {
    this._selectedStepName = stepName;
    this.stepLogoUrl$ = this.store
      .select(BuilderSelectors.selectCurrentFlow)
      .pipe(
        switchMap((flow) => {
          const step = flowHelper.getStep(
            flow.version,
            this.stepResult.stepName
          );
          assertNotNullOrUndefined(step, 'step');
          return this.pieceMetadataService.getStepDetails(step).pipe(
            map((stepDetails) => {
              return stepDetails.logoUrl;
            })
          );
        })
      );

    if (this._selectedStepName === this.stepResult.stepName) {
      this.runDetailsService.hideAllIterationsInput$.next(true);
      this.childStepSelected.emit();
    }
  }
  @Input() nestingLevel = 0;
  @Input({ required: true }) isTrigger = false;
  @Output() childStepSelected = new EventEmitter();
  stepLogoUrl$: Observable<string | undefined>;
  isLoopStep = false;
  nestingLevelPadding = '0px';
  iterationIndexControl = new UntypedFormControl(1);
  iteration$: Observable<Pick<StepRunResult, 'stepName' | 'output'>[]>;
  iterationsAccordionList: Pick<StepRunResult, 'stepName' | 'output'>[][] = [];
  previousIterationIndex = 0;
  hideIterationInput$: Observable<boolean>;
  showIterationInput = false;
  iterationInputMinWidth = '0px';
  _selectedStepName: string | null = '';
  StepOutputStatus = StepOutputStatus;
  constructor(
    private store: Store,
    private pieceMetadataService: PieceMetadataService,
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

    if (this.stepResult.output?.type === ActionType.LOOP_ON_ITEMS) {
      this.isLoopStep = true;
      const loopOutput = this.stepResult.output;
      loopOutput.output?.iterations.forEach((iteration) => {
        this.iterationsAccordionList.push(
          this.createStepResultsForDetailsAccordion(iteration)
        );
      });
      const startingIndex = this.hasAnIterationFailed()
        ? this.stepResult.output.output?.iterations.length
        : 1;
      this.iteration$ = this.iterationIndexControl.valueChanges.pipe(
        startWith(startingIndex),
        tap((newIndex: number | null) => {
          console.log(newIndex);
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
    if (
      this.stepResult.output?.type !== ActionType.LOOP_ON_ITEMS ||
      !this.stepResult.output?.output
    ) {
      return 0;
    }
    const stepOutput = this.stepResult.output.output;
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

  private hasAnIterationFailed() {
    if (this.stepResult.output?.type === ActionType.LOOP_ON_ITEMS) {
      const loopOutput = this.stepResult.output;
      return loopOutput.output?.iterations.some((iteration) =>
        this.checkIfIterationFailed(iteration)
      );
    }
    return false;
  }
  private checkIfIterationFailed(
    iteration: Record<string, StepOutput>
  ): boolean {
    const iterationStepsNames = Object.keys(iteration);
    return iterationStepsNames.some((stepName) => {
      const it = iteration[stepName];
      if (it.type === ActionType.LOOP_ON_ITEMS) {
        return this.checkIfLoopStepOutputFailed(it);
      }
      return iteration[stepName].status === StepOutputStatus.FAILED;
    });
  }
  private checkIfLoopStepOutputFailed(
    stepOutput: GenericStepOutput<ActionType.LOOP_ON_ITEMS, LoopStepResult>
  ): boolean {
    return stepOutput.output
      ? stepOutput.output.iterations.some((iteration) => {
          const iterationStepsNames = Object.keys(iteration);
          return iterationStepsNames.some((stepName) => {
            const it = iteration[stepName];
            if (it.type === ActionType.LOOP_ON_ITEMS) {
              return this.checkIfLoopStepOutputFailed(it);
            }
            return iteration[stepName].status === StepOutputStatus.FAILED;
          });
        })
      : false;
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

    if (
      stepWithinLoop.output?.type === ActionType.LOOP_ON_ITEMS &&
      stepWithinLoop.output?.output
    ) {
      if (stepWithinLoop.output.output.iterations[0]) {
        const firstIterationResult = this.createStepResultsForDetailsAccordion(
          stepWithinLoop.output.output.iterations[0]
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
    if (
      this.stepResult.output?.type !== ActionType.LOOP_ON_ITEMS ||
      !this.stepResult.output?.output
    ) {
      return 0;
    }
    return this.stepResult.output?.output.iterations.length;
  }
}
