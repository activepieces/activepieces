import { VariableService } from '../services/variable-service';
import {
  Action,
  ExecutionState,
  PieceAction,
  StepOutput,
  StepOutputStatus
} from '@activepieces/shared';
import { BaseActionHandler } from './action-handler';
import { globals } from '../globals';
import { isNil } from 'lodash';
import { pieceHelper } from '../helper/piece-helper';
import { createContextStore } from '../services/storage.service';
import { connectionManager } from '../services/connections.service';

export class PieceActionHandler extends BaseActionHandler<PieceAction> {
  variableService: VariableService;

  constructor(
    action: PieceAction,
    nextAction: BaseActionHandler<Action> | undefined
  ) {
    super(action, nextAction);
    this.variableService = new VariableService();
  }

  async execute(
    executionState: ExecutionState
  ): Promise<StepOutput> {
    const stepOutput = new StepOutput();

    const { input, pieceName, pieceVersion, actionName } = this.action.settings;
    const piece = await pieceHelper.loadPieceOrThrow(pieceName, pieceVersion);
    if (!actionName) {
      throw new Error("Action name is not defined");
    }

    const action = piece.getAction(actionName);

    if (isNil(action)) {
      throw new Error(`error=action_not_found action_name=${actionName}`);
    }
    const { result, errors } = this.variableService.validateAndCast(await this.variableService.resolve(
      input,
      executionState
    ), action.props);

    globals.addOneTask();
    stepOutput.input = this.variableService.validateAndCast(await this.variableService.resolve(
      input,
      executionState,
      true
    ), action.props).result;

    try {
      if (Object.keys(errors).length > 0) {
        throw new Error(JSON.stringify(errors));
      }
      stepOutput.output = await action.run({
        store: createContextStore('', globals.flowId),
        propsValue: result,
        connections: connectionManager
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
