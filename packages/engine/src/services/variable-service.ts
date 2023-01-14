import { get } from 'lodash';
import { isString } from 'lodash';
import { ExecutionState } from 'shared';
import { connectionService } from './connections.service';
import replaceAsync from "string-replace-async";

export class VariableService {
  private VARIABLE_TOKEN = RegExp('\\$\\{(.*?)\\}', 'g');
  private static CONFIGS = 'configs';
  private static CONNECTIONS = 'connections';
  private static STEPS = 'steps';

  private findPath(path: string) {
    const paths = path.split('.');
    if (
      paths.length > 0 &&
      paths[0] !== VariableService.CONFIGS &&
      paths[0] !== VariableService.CONNECTIONS
    ) {
      paths.splice(0, 0, VariableService.STEPS);
    }
    return paths.join('.');
  }

  private async resolveInput(input: string, valuesMap: any): Promise<any> {

    // If input contains only a variable token, return the value of the variable while maintaining the variable type.
    if (
      input.match(this.VARIABLE_TOKEN) !== null &&
      input.match(this.VARIABLE_TOKEN)!.length === 1 &&
      input.match(this.VARIABLE_TOKEN)![0] === input
    ) {
      let resolvedInput = await VariableService.handleTypeAndResolving(
        valuesMap,
        this.findPath(input.substring(2, input.length - 1))
      )
      return resolvedInput;
    }
    // If input contains other text, replace the variable with its value as a string.
    return await replaceAsync(input, this.VARIABLE_TOKEN, async (_, matchedKey) => {
      const resolvedInput = await VariableService.handleTypeAndResolving(
        valuesMap,
        this.findPath(matchedKey)
      );
      if (resolvedInput === undefined) {
        return '';
      } else if (isString(resolvedInput)) {
        return resolvedInput;
      } else {
        return JSON.stringify(resolvedInput);
      }
    });
  }


  private static async handleTypeAndResolving(valuesMap: any, path: string): Promise<any> {
    let paths = path.split(".");
    if (paths[0] === this.CONNECTIONS) {
      // Invalid naming return nothing
      if (paths.length < 2) {
        return '';
      }
      // Need to be resolved dynamically
      let connectioName = paths[1];
      paths.splice(0, 2);
      let newPath = paths.join(".");
      const connection = (await connectionService.obtain(connectioName))?.value;
      if (paths.length === 0) {
        return connection;
      }
      return this.copyFromMap(connection, newPath);
    }
    return this.copyFromMap(valuesMap, path);
  }

  private static copyFromMap(valuesMap: any, path: string) {
    const value = get(valuesMap, path);
    if (value === undefined) {
      return '';
    }
    return value;
  }

  private async resolveInternally(unresolvedInput: any, valuesMap: any): Promise<any> {
    if (unresolvedInput === undefined || unresolvedInput === null) {
      return unresolvedInput;
    } else if (isString(unresolvedInput)) {
      return this.resolveInput(unresolvedInput, valuesMap);
    } else if (Array.isArray(unresolvedInput)) {
      for (let i = 0; i < unresolvedInput.length; ++i) {
        unresolvedInput[i] = await this.resolveInternally(unresolvedInput[i], valuesMap);
      }
    } else if (typeof unresolvedInput === 'object') {
      const entries = Object.entries(unresolvedInput);
      for (let i = 0; i < entries.length; ++i) {
        const [key, value] = entries[i];
        unresolvedInput[key] = await this.resolveInternally(value, valuesMap);
      }
    }
    return unresolvedInput;
  }

  private getExecutionStateObject(executionState: ExecutionState): object {
    type ValuesMap = {
      configs: { [key: string]: unknown };
      steps: { [key: string]: unknown };
    };
    const valuesMap: ValuesMap = { configs: {}, steps: {} };

    Object.entries(executionState.configs).forEach(([key, value]) => {
      valuesMap.configs[key] = value;
    });

    Object.entries(executionState.lastStepState).forEach(([key, value]) => {
      valuesMap.steps[key] = value;
    });

    return valuesMap;
  }

  resolve(unresolvedInput: any, executionState: ExecutionState): Promise<any> {
    return this.resolveInternally(
      JSON.parse(JSON.stringify(unresolvedInput)),
      this.getExecutionStateObject(executionState)
    );
  }
}
