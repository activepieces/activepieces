import { ComponentExecuter } from "../../../executors/component-executer";
import { VariableService } from "../../../services/variable-service";
import { ExecutionState } from "../../execution/execution-state";
import { StepOutput, StepOutputStatus } from "../../output/step-output";
import { StoreScope } from "../../util/store-scope";
import { Action, ActionType } from "../action";

export class ComponentActionSettings {
  componentName: string;
  actionName: string;
  input: Record<string, any>;

  constructor(componentName: string, actionName: string, input: Record<string, any>) {
    this.validate(componentName, actionName);
    this.componentName = componentName;
    this.actionName = actionName;
    this.input = input;
  }

  private validate(componentName: string, actionName: string) {
    if (!componentName) {
      throw Error('Settings "componentName" attribute is undefined.');
    }

    if (!actionName) {
      throw Error('Settings "actionName" attribute is undefined.');
    }
  }

  static deserialize(jsonData: any): ComponentActionSettings {
    return new ComponentActionSettings(
      jsonData['componentName'],
      jsonData['actionName'],
      jsonData['input'],
    );
  }
}

export class ComponentAction extends Action {
  variableService: VariableService;
  settings: ComponentActionSettings;

  constructor(
    type: ActionType,
    name: string,
    settings: ComponentActionSettings,
    nextAction?: Action
  ) {
    super(type, name, nextAction);
    this.settings = settings;
    this.variableService = new VariableService();
  }

  async execute(
    executionState: ExecutionState,
    _ancestors: [string, number][],
    _storeScope: StoreScope
  ): Promise<StepOutput> {
    const stepOutput = new StepOutput();

    const config = this.variableService.resolve(
      this.settings.input,
      executionState
    );

    try {
      const executer = new ComponentExecuter();

      stepOutput.output = await executer.exec(
        this.settings.componentName,
        this.settings.actionName,
        config
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
