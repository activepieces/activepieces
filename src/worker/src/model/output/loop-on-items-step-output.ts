import {StepOutput} from './step-output';

export class LoopOnItemsStepOutput extends StepOutput {
  iterations: Map<string, StepOutput>[];

  constructor() {
    super();
    this.iterations = [];
  }
}
