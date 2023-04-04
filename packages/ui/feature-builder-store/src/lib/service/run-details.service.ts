import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { StepOutput } from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class RunDetailsService {
  currentStepResult$: BehaviorSubject<
    { stepName: string; result: StepOutput | undefined } | undefined
  > = new BehaviorSubject<
    { stepName: string; result: StepOutput | undefined } | undefined
  >(undefined);
  iterationStepResultState$: Subject<{
    stepName: string;
    result: StepOutput | undefined;
  }> = new Subject();
  hideAllIterationsInput$: Subject<boolean> = new Subject();
}
