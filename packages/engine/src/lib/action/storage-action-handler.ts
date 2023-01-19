import { VariableService } from '../services/variable-service';
import {
  ExecutionState,
  PutStoreEntryRequest,
  StepOutput,
  StepOutputStatus,
  StorageAction,
  StoreOperation
} from 'shared';
import { BaseActionHandler } from './action-handler';
import { storageService } from '../services/storage.service';

export class StorageActionHandler extends BaseActionHandler<StorageAction> {
  variableService: VariableService;

  constructor(action: StorageAction, nextAction?: BaseActionHandler<any>) {
    super(action, nextAction);
    this.variableService = new VariableService();
  }

  async execute(
    executionState: ExecutionState,
    ancestors: [string, number][]
  ): Promise<StepOutput> {
    const stepOutput = new StepOutput();
    try {
      let data = undefined;
      const key = await this.variableService.resolve(
        this.action.settings.key,
        executionState
      );
      switch (this.action.settings.operation) {
        case StoreOperation.GET:
          data = (await storageService.get(key))?.value ?? null;
          break;
        case StoreOperation.PUT:
          const value = await this.variableService.resolve(
            this.action.settings.value,
            executionState
          );
          const putRequest: PutStoreEntryRequest = {
            value: value,
            key: key
          };
          data = (await storageService.put(putRequest))?.value ?? null;
          break;
      }
      stepOutput.output = {
        value: data
      };
      stepOutput.status = StepOutputStatus.SUCCEEDED;
    } catch (e) {
      console.error(e);
      stepOutput.status = StepOutputStatus.FAILED;
    }
    return Promise.resolve(stepOutput);
  }
}
