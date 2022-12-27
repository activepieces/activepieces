import {ExecutionState} from '../model/execution/execution-state';
import {StepOutput, StepOutputStatus} from '../model/output/step-output';
import {globals} from '../globals';
import {VariableService} from '../services/variable-service';
import {PutStoreEntryRequest, StorageAction} from "shared";
import {StoreOperation} from "shared/dist/flows/actions/action";
import {BaseActionHandler} from "./action-handler";

const axios = require('axios').default;


export class StorageActionExecutor extends BaseActionHandler<StorageAction> {
  variableService: VariableService;

  constructor(
    action: StorageAction,
    nextAction?: BaseActionHandler<any>
  ) {
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
        Authorization: 'Bearer ' + globals.workerToken,
      };
      const key = this.variableService.resolve(
        this.action.settings.key,
        executionState
      );
      switch (this.action.settings.operation) {
        case StoreOperation.GET:
          data = (
            await axios({
              method: 'GET',
              url: globals.apiUrl + '/v1/store-entries?key=' + key,
              headers: headers,
            })
          ).data;
          break;
        case StoreOperation.PUT:
          const value = this.variableService.resolve(
            this.action.settings.value,
            executionState
          );
          const putRequest: PutStoreEntryRequest = {
            value: value,
            key: key,
          };
          data = (
            await axios({
              method: 'POST',
              url: globals.apiUrl + '/v1/store-entries',
              data: putRequest,
              headers: headers,
            })
          ).data;
          break;
      }
      stepOutput.output = {
        value: data,
      };
      stepOutput.status = StepOutputStatus.SUCCEEDED;
    } catch (e) {
      console.error(e);
      stepOutput.status = StepOutputStatus.FAILED;
    }
    return Promise.resolve(stepOutput);
  }
}
