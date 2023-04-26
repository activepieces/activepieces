import { VariableService } from '../services/variable-service';
import { CodeExecutor } from '../executors/code-executer';

import {
  Action,
  CodeAction,
  ExecutionState,
  StepOutput,
  StepOutputStatus
} from '@activepieces/shared';
import { BaseActionHandler } from './action-handler';
import { globals } from '../globals';

export class CodeActionHandler extends BaseActionHandler<CodeAction> {
  variableService: VariableService;

  constructor(
    action: CodeAction,
    nextAction: BaseActionHandler<Action> | undefined
  ) {
    super(action, nextAction);
    this.variableService = new VariableService();
  }

  async execute(
    executionState: ExecutionState
  ): Promise<StepOutput> {

    globals.addOneTask();
    const stepOutput = new StepOutput();
    const params = await this.variableService.resolve(
      this.action.settings.input,
      executionState
    );
    const artifactPackagedId = this.action.settings.artifactPackagedId;
    if(!artifactPackagedId){
      throw new Error("Artifact packaged id is not defined");
    }
    stepOutput.input = params;
    try {
      const codeExecutor = new CodeExecutor();
      stepOutput.output = await codeExecutor.executeCode(
        artifactPackagedId,
        params
      );
      stepOutput.status = StepOutputStatus.SUCCEEDED;
      return stepOutput;
    } catch (e) {
      console.error(e);
      stepOutput.errorMessage = (e as Error).message;
      stepOutput.status = StepOutputStatus.FAILED;
      return stepOutput;
    }
  }
}
