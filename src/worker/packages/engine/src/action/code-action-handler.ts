import {ExecutionState} from '../model/execution/execution-state';
import {StepOutput, StepOutputStatus} from '../model/output/step-output';
import {VariableService} from '../services/variable-service';
import {CodeExecutor} from '../executors/code-executer';

import {CodeAction} from "shared";
import {BaseActionHandler} from "./action-handler";

export class CodeActionHandler extends BaseActionHandler<CodeAction> {
  variableService: VariableService;

  constructor(
    action: CodeAction,
    nextAction: BaseActionHandler<any> | undefined
  ) {
    super(action, nextAction);
    this.variableService = new VariableService();
  }

  async execute(
    executionState: ExecutionState,
    ancestors: [string, number][]
  ): Promise<StepOutput> {
    const stepOutput = new StepOutput();
    const params = this.variableService.resolve(
      this.action.settings.input,
      executionState
    );
    stepOutput.input = params;
    try {
      const codeExecutor = new CodeExecutor();
      stepOutput.output = await codeExecutor.executeCode(
        this.action.settings.artifactPackagedId,
        params
      );
      stepOutput.status = StepOutputStatus.SUCCEEDED;
      return stepOutput;
    } catch (e) {
     // console.error(e);
      stepOutput.errorMessage = (e as Error).message;
      stepOutput.status = StepOutputStatus.FAILED;
      return stepOutput;
    }
  }
}


