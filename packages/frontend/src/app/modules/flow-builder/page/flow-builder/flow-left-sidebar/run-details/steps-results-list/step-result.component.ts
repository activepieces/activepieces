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

import { map, Observable, startWith, tap } from 'rxjs';
import { RunDetailsService } from '../iteration-details.service';
import { FlowsActions } from '../../../../../store/flow/flows.action';
import { StepOutput, StepOutputStatus } from '@activepieces/shared';
import { fadeInAnimation } from '../../../../../../common/animation/fade-in.animations';

@Component({
  selector: 'app-step-result',
  templateUrl: './step-result.component.html',
  styleUrls: ['./step-result.component.scss'],
  animations: [fadeInAnimation(400, false)],
})
export class StepResultComponent implements OnInit, AfterViewInit {
  @Input() stepNameAndResult: { stepName: string; result: StepOutput };
  @Input() set selectedStepName(stepName: string | null) {
    this._selectedStepName = stepName;
    if (this._selectedStepName === this.stepNameAndResult.stepName) {
      this.runDetailsService.hideAllIterationsInput$.next(true);
      this.childStepSelected.emit();
    }
  }
  @Input() nestingLevel = 0;
  @Input() isTrigger = false;
  @Output() childStepSelected = new EventEmitter();
  isLoopStep = false;
  nestingLevelPadding = '0px';
  finishedBuilding = false;
  iterationIndexControl = new UntypedFormControl(1);
  iteration$: Observable<{ stepName: string; result: StepOutput }[]>;
  iterationsAccordionList: { stepName: string; result: StepOutput }[][] = [];
  private previousIterationIndex=0;
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
    if (this.stepNameAndResult.result.output?.iterations !== undefined) {
      this.isLoopStep = true;
      const loopOutput = this.stepNameAndResult.result;
      loopOutput.output.iterations.forEach((iteration) => {
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
        tap(newIndex=>{
          this.iterationIndexControl.setValue(
           newIndex, {emitEvent:false}
          );
        }),
        map((newIndex: number) => {
          if (!newIndex) {
            return this.iterationsAccordionList[0] || [];
          }
          const iteration = this.iterationsAccordionList[newIndex - 1];
          return iteration || [];
        }),
        tap((iteration) => {
        const previousIteration = this.iterationsAccordionList[this.previousIterationIndex];
        previousIteration?.forEach((st) => {
          this.clearStepsThatWereNotReached(st);
        });
         this.findCurrentStepResultInCurrentIteration(iteration); 
         this.previousIterationIndex=this.iterationIndexControl.value-1;  
        })
      );
    }

    if (this._selectedStepName === this.stepNameAndResult.stepName) {
      this.childStepSelected.emit();
      this.runDetailsService.currentStepResult$.next(this.stepNameAndResult);
    }
  }

  private findCurrentStepResultInCurrentIteration(iteration:{stepName:string,result:StepOutput}[])
  {
    iteration.forEach((st) => {
      const stepNameAndResult = {
        stepName: st.stepName,
        result: st.result,
      };
      this.runDetailsService.iterationStepResultState$.next(
        stepNameAndResult
      );
      if (
        st.stepName ===
        this.runDetailsService.currentStepResult$.value?.stepName
      ) {
        this.runDetailsService.currentStepResult$.next(stepNameAndResult);
      }
    });
  }
  private minMaxIterationIndex(newIndex:number |null)
  {
    if (newIndex === null || newIndex < 1) {
      return 1;
    }
     else if (
      newIndex > this.stepNameAndResult.result.output.iterations!.length
    ) {
      return this.stepNameAndResult.result.output.iterations!.length;
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
    if (this._selectedStepName !== this.stepNameAndResult.stepName) {
      this.store.dispatch(
        FlowsActions.selectStepByName({
          stepName: this.stepNameAndResult.stepName,
        })
      );
      this.runDetailsService.hideAllIterationsInput$.next(true);
      this.childStepSelected.emit();
      this.runDetailsService.currentStepResult$.next(this.stepNameAndResult);
    } else if (expansionPanel) {
      expansionPanel.toggle();
    }

    $event.stopPropagation();
  }

  createStepResultsForDetailsAccordion(iteration: {
    [key: string]: StepOutput;
  }): {
    result: StepOutput;
    stepName: string;
  }[] {
    const iterationStepsNames = Object.keys(iteration);
    return iterationStepsNames.map((stepName) => {
      return {
        stepName: stepName,
        result: iteration[stepName],
      };
    });
  }

  indexSearchClicked($event: MouseEvent) {
    $event.stopPropagation();
  }

  clearStepsThatWereNotReached(parentLoopStepResultAndName: {
    stepName: string;
    result: StepOutput;
  }) {
    this.runDetailsService.iterationStepResultState$.next({
      stepName: parentLoopStepResultAndName.stepName,
      result: undefined,
    });
    if (
      parentLoopStepResultAndName.stepName ===
      this.runDetailsService.currentStepResult$.value?.stepName
    ) {
      this.runDetailsService.currentStepResult$.next(undefined);
    }
    if (parentLoopStepResultAndName.result.output?.iterations) {
      const firstIterationResult = this.createStepResultsForDetailsAccordion(
        parentLoopStepResultAndName.result.output.iterations[0]
      );
      firstIterationResult.forEach((st) => {
        this.clearStepsThatWereNotReached(st);
      });
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
}
