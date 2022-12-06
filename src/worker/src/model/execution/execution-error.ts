export class ExecutionError {
  stepName: string;
  errorMessage: string;

  constructor(actionName: string, errorMessage: string) {
    this.stepName = actionName;
    this.errorMessage = errorMessage;
  }
}
