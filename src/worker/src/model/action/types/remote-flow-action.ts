import {Action, ActionType} from '../action';
import {ExecutionState} from '../../execution/execution-state';
import {StepOutput, StepOutputStatus} from '../../output/step-output';
import {FlowExecutor} from '../../../executors/flow-executor';
import {VariableService} from '../../../services/variable-service';
import {ExecutionOutputStatus} from '../../execution/execution-output';

export class RemoteFlowActionSettings {
  input: any;
  pieceVersionId: string;
  flowVersionId: string;

  constructor(input: any, pieceVersionId: string, flowVersionId: string) {
    this.validate(pieceVersionId, flowVersionId);
    this.input = input;
    this.pieceVersionId = pieceVersionId;
    this.flowVersionId = flowVersionId;
  }

  validate(pieceVersionId: string, flowVersionId: string) {
    if (!pieceVersionId) {
      throw Error('Settings "pieceVersionId" attribute is undefined.');
    }

    if (!flowVersionId) {
      throw Error('Settings "flowVersionId" attribute is undefined.');
    }
  }

  static deserialize(jsonData: any): RemoteFlowActionSettings {
    return new RemoteFlowActionSettings(
      jsonData['input'],
      jsonData['pieceVersionId'],
      jsonData['flowVersionId']
    );
  }
}

export class RemoteFlowAction extends Action {
  variableService: VariableService;
  settings: RemoteFlowActionSettings;

  constructor(
    type: ActionType,
    name: string,
    settings: RemoteFlowActionSettings,
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
      const resolvedInput = this.variableService.resolve(
        this.settings.input,
        executionState
      );
      stepOutput.input = resolvedInput;

      const childExecutionState = new ExecutionState();
      childExecutionState.insertConfigs(resolvedInput);

      const childFlowExecutor = new FlowExecutor(childExecutionState);
      const executionOutput = await childFlowExecutor.executeFlow(
        this.settings.pieceVersionId,
        this.settings.flowVersionId
      );

      if (executionOutput.status === ExecutionOutputStatus.SUCCEEDED) {
        stepOutput.status = StepOutputStatus.SUCCEEDED;
        stepOutput.output = executionOutput.output;
      } else {
        stepOutput.status = StepOutputStatus.FAILED;
        stepOutput.errorMessage = executionOutput.errorMessage?.errorMessage;
      }

      return Promise.resolve(stepOutput);
    } catch (e) {
      stepOutput.errorMessage = (e as Error).message;
      stepOutput.status = StepOutputStatus.FAILED;
      return Promise.resolve(stepOutput);
    }
  }
}
