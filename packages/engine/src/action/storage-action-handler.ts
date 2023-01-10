import { globals } from '../globals';
import { VariableService } from '../services/variable-service';
import {
  ExecutionState,
  PutStoreEntryRequest,
  StepOutput,
  StepOutputStatus,
  StorageAction
} from 'shared';
import { BaseActionHandler } from './action-handler';
import { StoreOperation } from 'shared';
import axios from 'axios';

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
      const headers = {
        Authorization: 'Bearer ' + globals.workerToken
      };
      const key = await this.variableService.resolve(
        this.action.settings.key,
        executionState
      );
      switch (this.action.settings.operation) {
        case StoreOperation.GET:
          data =
            (
              await axios.get(globals.apiUrl + '/v1/store-entries?key=' + key, {
                headers: headers
              })
            ).data?.value ?? null;
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
          data =
            (
              await axios({
                method: 'POST',
                url: globals.apiUrl + '/v1/store-entries',
                data: putRequest,
                headers: headers
              })
            ).data?.value ?? null;
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
