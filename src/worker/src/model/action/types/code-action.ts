import {Action, ActionType} from '../action';
import {ExecutionState} from '../../execution/execution-state';
import {StepOutput, StepOutputStatus} from '../../output/step-output';
import {VariableService} from '../../../services/variable-service';
import {CodeExecutor} from '../../../executors/code-executer';
import {StoreScope} from '../../util/store-scope';

export class CodeActionSettings {
  input: any;
  artifactPackagedId: string;

  constructor(input: any, artifactPackagedId: string) {
    this.validate(artifactPackagedId);
    this.input = input;
    this.artifactPackagedId = artifactPackagedId;
  }

  validate(artifact: string) {
    if (!artifact) {
      throw Error('Settings "artifact" attribute is undefined.');
    }
  }

  static deserialize(jsonData: any): CodeActionSettings {
    return new CodeActionSettings(
      jsonData['input'],
      jsonData['artifactPackagedId']
    );
  }
}

export class CodeAction extends Action {
  variableService: VariableService;
  settings: CodeActionSettings;

  constructor(
    type: ActionType,
    name: string,
    settings: CodeActionSettings,
    nextAction?: Action
  ) {
    super(type, name, nextAction);
    this.settings = settings;
    this.variableService = new VariableService();
  }

  async execute(
    executionState: ExecutionState,
    ancestors: [string, number][],
    storeScope: StoreScope
  ): Promise<StepOutput> {
    const stepOutput = new StepOutput();
    const params = this.variableService.resolve(
      this.settings.input,
      executionState
    );
    stepOutput.input = params;
    try {
      const codeExecutor = new CodeExecutor();
      stepOutput.output = await codeExecutor.executeCode(
        this.settings.artifactPackagedId,
        params
      );
      stepOutput.status = StepOutputStatus.SUCCEEDED;
      return stepOutput;
    } catch (e) {
      stepOutput.errorMessage = (e as Error).message;
      stepOutput.status = StepOutputStatus.FAILED;
      return stepOutput;
    }
  }
}
