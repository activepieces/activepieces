export enum StepOutputStatus {
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

export class StepOutput {
  duration?: number;
  input?: any;
  output?: any;
  status?: StepOutputStatus;
  errorMessage?: any;

  constructor(
    duration?: number,
    input?: any,
    output?: any,
    status?: StepOutputStatus,
    errorMessage?: any
  ) {
    this.duration = duration;
    this.input = input;
    this.output = output;
    this.status = status;
    this.errorMessage = errorMessage;
  }

  static deserialize(jsonData: any): StepOutput {
    return new StepOutput(
      jsonData['duration'],
      jsonData['input'],
      jsonData['output'],
      jsonData['status'] as StepOutputStatus,
      jsonData['errorMessage']
    );
  }
}
