import {StepOutput} from './step-output';

export class LoopOnItemsStepOutput extends StepOutput {
  override output:
    | {
        current_item: any;
        current_iteration: number;
        iterations: Record<string, StepOutput>[];
      }
    | undefined;

  constructor() {
    super();
    this.output = {
      current_item: undefined,
      current_iteration: 0,
      iterations: [],
    };
  }
}
