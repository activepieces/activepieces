import {Action, ActionType} from '../action';
import {ExecutionState} from '../../execution/execution-state';
import {StepOutput, StepOutputStatus} from '../../output/step-output';
import {VariableService} from '../../../services/variable-service';
import {CodeExecutor} from '../../../executors/code-executer';

export class CodeActionSettings {
  input: any;
  artifactPackagedId: string;

  constructor(input: any, artifactPackagedId: string) {
    this.validate(artifactPackagedId);
    this.input = input;
    this.artifactPackagedId = artifactPackagedId;
  }

  validate(artifactPackagedId: string) {
    if (!artifactPackagedId) {
      throw Error('Settings "artifactPackagedId" attribute is undefined.');
    }

  }

  static deserialize(jsonData: any): CodeActionSettings {
    return new CodeActionSettings(
      jsonData['input'],
      jsonData['artifact']
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
    ancestors: [string, number][]
  ): Promise<StepOutput> {
    const stepOutput = new StepOutput();
    try {
      const params = this.variableService.resolve(
        this.settings.input,
        executionState
      );
      const codeExecutor = new CodeExecutor();

      stepOutput.output = await codeExecutor.executeCode(
        this.settings.artifact,
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
