import {get} from 'lodash';
import {ExecutionState} from '../model/execution/execution-state';
import {isString} from "lodash";

export class VariableService {
  private VARIABLE_TOKEN = RegExp('\\$\\{(.*?)\\}', 'g');
  private CONFIGS = 'configs';
  private CONTEXT = 'context';
  private OUTPUT = 'output';
  private STEPS = 'steps';

  private findPath(path: string) {
    const paths = path.split('.');
    if (
      paths.length > 0 &&
      paths[0] !== this.CONFIGS &&
      paths[0] !== this.CONTEXT
    ) {
      paths.splice(1, 0, this.OUTPUT);
      paths.splice(0, 0, this.STEPS);
    }
    return paths.join('.');
  }

  private resolveInput(input: string, valuesMap: any) {
    // If input contains only a variable token, return the value of the variable while maintaining the variable type.
    if (
      input.match(this.VARIABLE_TOKEN) !== null &&
      input.match(this.VARIABLE_TOKEN)!.length === 1 &&
      input.match(this.VARIABLE_TOKEN)![0] === input
    ) {
      const resolvedInput = get(
        valuesMap,
        this.findPath(input.substring(2, input.length - 1))
      );
      if (resolvedInput === undefined) {
        return '';
      }
      return resolvedInput;
    }

    // If input contains other text, replace the variable with its value as a string.
    return input.replace(this.VARIABLE_TOKEN, (_, matchedKey) => {
      const resolvedInput = get(valuesMap, this.findPath(matchedKey));
      if (resolvedInput === undefined) {
        return '';
      } else if ( isString(resolvedInput)) {
        return resolvedInput;
      } else {
        return JSON.stringify(resolvedInput);
      }
    });
  }

  private resolveInternally(unresolvedInput: any, valuesMap: any) {
    if (isString(unresolvedInput)) {
      return this.resolveInput(unresolvedInput, valuesMap);
    } else if (Array.isArray(unresolvedInput)) {
      unresolvedInput.forEach(
        (input, index) =>
          (unresolvedInput[index] = this.resolveInternally(input, valuesMap))
      );
    } else if (typeof unresolvedInput === 'object') {
      Object.entries(unresolvedInput).forEach(([key, value]) => {
        unresolvedInput[key] = this.resolveInternally(value, valuesMap);
      });
    }

    return unresolvedInput;
  }

  private getExecutionStateObject(executionState: ExecutionState): object {
    type ValuesMap = {
      configs: {[key: string]: any};
      steps: {[key: string]: any};
    };
    const valuesMap: ValuesMap = {configs: {}, steps: {}};

    executionState.configs.forEach((value, key) => {
      valuesMap.configs[key] = value;
    });

    executionState.steps.forEach((value, key) => {
      valuesMap.steps[key] = value;
    });

    return valuesMap;
  }

  resolve(unresolvedInput: any, executionState: ExecutionState) {
    return this.resolveInternally(
      unresolvedInput,
      this.getExecutionStateObject(executionState)
    );
  }
}
