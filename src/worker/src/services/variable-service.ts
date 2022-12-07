import {get} from 'lodash';
import {ExecutionState} from '../model/execution/execution-state';
import {isString} from 'lodash';
import {StepOutput} from '../model/output/step-output';

export class VariableService {
  private VARIABLE_TOKEN = RegExp('\\$\\{(.*?)\\}', 'g');
  private CONFIGS = 'configs';
  private CONTEXT = 'context';
  private STEPS = 'steps';

  private findPath(path: string) {
    const paths = path.split('.');
    if (
      paths.length > 0 &&
      paths[0] !== this.CONFIGS &&
      paths[0] !== this.CONTEXT
    ) {
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
      const resolvedInput = VariableService.copyFromMap(
        valuesMap,
        this.findPath(input.substring(2, input.length - 1))
      );
      return resolvedInput;
    }

    // If input contains other text, replace the variable with its value as a string.
    return input.replace(this.VARIABLE_TOKEN, (_, matchedKey) => {
      const resolvedInput = VariableService.copyFromMap(
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

  private static copyFromMap(valuesMap: any, path: string) {
    const value = get(valuesMap, path);
    if (value === undefined) {
      return '';
    }
    return value;
  }

  private resolveInternally(unresolvedInput: any, valuesMap: any) {
    if (unresolvedInput === undefined || unresolvedInput === null) {
      return unresolvedInput;
    } else if (isString(unresolvedInput)) {
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
      configs: {[key: string]: unknown};
      steps: {[key: string]: unknown};
      context: {[key: string]: unknown};
    };
    const valuesMap: ValuesMap = {context: {}, configs: {}, steps: {}};

    Object.entries(executionState.context).forEach(([key, value]) => {
      valuesMap.context[key] = value;
    });

    Object.entries(executionState.configs).forEach(([key, value]) => {
      valuesMap.configs[key] = value;
    });

    Object.entries(executionState.lastStepState).forEach(([key, value]) => {
      valuesMap.steps[key] = value;
    });

    return valuesMap;
  }

  resolve(unresolvedInput: any, executionState: ExecutionState) {
    return this.resolveInternally(
      JSON.parse(JSON.stringify(unresolvedInput)),
      this.getExecutionStateObject(executionState)
    );
  }
}
