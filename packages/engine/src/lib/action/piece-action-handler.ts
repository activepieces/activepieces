import { VariableService } from '../services/variable-service';
import {
  ExecutionState,
  PieceAction,
  StepOutput,
  StepOutputStatus
} from '@activepieces/shared';
import { BaseActionHandler } from './action-handler';
import { PieceExecutor } from '../executors/piece-executor';

export class PieceActionHandler extends BaseActionHandler<PieceAction> {
  variableService: VariableService;

  constructor(
    action: PieceAction,
    nextAction: BaseActionHandler<any> | undefined
  ) {
    super(action, nextAction);
    this.variableService = new VariableService();
  }

  async execute(
    executionState: ExecutionState,
    _ancestors: [string, number][]
  ): Promise<StepOutput> {
    const stepOutput = new StepOutput();

    const config = await this.variableService.resolve(
      this.action.settings.input,
      executionState
    );

    stepOutput.input = config;

    try {
      const executer = new PieceExecutor();

      stepOutput.output = await executer.exec({
        pieceName: this.action.settings.pieceName,
        actionName: this.action.settings.actionName!,
        config,
      });

      stepOutput.status = StepOutputStatus.SUCCEEDED;
      return stepOutput;
    } catch (e) {
      stepOutput.errorMessage = (e as Error).message;
      stepOutput.status = StepOutputStatus.FAILED;
      return stepOutput;
    }
  }
}
