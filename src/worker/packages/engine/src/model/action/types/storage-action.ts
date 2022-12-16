import {ExecutionState} from '../../execution/execution-state';
import {StepOutput, StepOutputStatus} from '../../output/step-output';
import {StoreScope} from '../../util/store-scope';
import {globals} from '../../../globals';
import {VariableService} from '../../../services/variable-service';
import {ActionMetadata, ActionType} from "../action-metadata";

const axios = require('axios').default;

export enum StorageOperation {
  GET = 'GET',
  PUT = 'PUT',
}

export enum StorageScope {
  INSTANCE = 'INSTANCE',
  COLLECTION = 'COLLECTION',
}

export interface GetStorageRequest {
  store_path: string[];
  scope: StorageScope;
}

export interface PutStorageRequest {
  store_path: string[];
  scope: StorageScope;
  value: any;
}

export class StorageActionSettings {
  operation: StorageOperation;
  key: string;
  value: string;
  scope: StorageScope;

  constructor(
    operation: StorageOperation,
    key: string,
    value: string,
    scope: StorageScope
  ) {
    this.operation = operation;
    this.key = key;
    this.value = value;
    this.scope = scope;
  }

  static deserialize(jsonData: any): StorageActionSettings {
    return new StorageActionSettings(
      jsonData['operation'] as StorageOperation,
      jsonData['key'],
      jsonData['value'],
      jsonData['scope'] as StorageScope
    );
  }
}

export class StorageAction extends ActionMetadata {
  settings: StorageActionSettings;
  variableService: VariableService;

  constructor(
    type: ActionType,
    name: string,
    settings: StorageActionSettings,
    nextAction?: ActionMetadata
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
    try {
      let data = undefined;
      const headers = {
        Authorization: 'Bearer ' + globals.workerToken,
      };
      const key = this.variableService.resolve(
        this.settings.key,
        executionState
      );
      switch (this.settings.operation) {
        case StorageOperation.GET:
          const getRequest: GetStorageRequest = {
            store_path: storeScope.key(key),
            scope: this.settings.scope,
          };
          data = (
            await axios({
              method: 'GET',
              url: globals.apiUrl + '/storage',
              data: getRequest,
              headers: headers,
            })
          ).data;
          break;
        case StorageOperation.PUT:
          const value = this.variableService.resolve(
            this.settings.value,
            executionState
          );
          const putRequest: PutStorageRequest = {
            value: value,
            store_path: storeScope.key(key),
            scope: this.settings.scope,
          };
          data = (
            await axios({
              method: 'POST',
              url: globals.apiUrl + '/storage',
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
