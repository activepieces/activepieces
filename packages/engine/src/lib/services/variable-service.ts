import { get, isNil, isString } from "lodash";
import { ExecutionState } from "@activepieces/shared";
import { connectionService } from "./connections.service";
import { PiecePropertyMap, PropertyType } from "@activepieces/pieces-framework";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

type ResolveParams = {
  unresolvedInput: unknown
  executionState: ExecutionState
  censorConnections: boolean
}

export class VariableService {
  private VARIABLE_TOKEN = RegExp('\\{\\{(.*?)\\}\\}', 'g');
  private static CONNECTIONS = 'connections';
  private async resolveInput(input: string, valuesMap: Record<string, unknown>, censorConnections: boolean): Promise<any> {
    // If input contains only a variable token, return the value of the variable while maintaining the variable type.
    const matchedTokens = input.match(this.VARIABLE_TOKEN);
    if (
      matchedTokens !== null &&
      matchedTokens.length === 1 &&
      matchedTokens[0] === input
    ) {
      const variableName = input.substring(2, input.length - 2);
      if (variableName.startsWith(VariableService.CONNECTIONS)) {
        return this.handleTypeAndResolving(variableName, censorConnections);
      }
      return this.evalInScope(variableName, valuesMap);
    }
    return input.replace(this.VARIABLE_TOKEN, (_match, variable) => {
      const result = this.evalInScope(variable, valuesMap);
      if (!isString(result)) {
        return JSON.stringify(result);
      }
      return result;
    });
  }

  private async handleTypeAndResolving(path: string, censorConnections: boolean): Promise<any> {
    const paths = path.split(".");
    // Invalid naming return nothing
    if (paths.length < 2) {
      return '';
    }
    if (censorConnections) {
      return "**CENSORED**";
    }
    // Need to be resolved dynamically
    const connectioName = paths[1];
    paths.splice(0, 2);
    const newPath = paths.join(".");
    const connection = (await connectionService.obtain(connectioName));
    if (paths.length === 0) {
      return connection;
    }
    return VariableService.copyFromMap(connection, newPath);
  }

  private static copyFromMap(valuesMap: any, path: string) {
    const value = get(valuesMap, path);
    if (value === undefined) {
      return '';
    }
    return value;
  }

  private evalInScope(js: string, contextAsScope: Record<string, unknown>) {
    try {
      const keys = Object.keys(contextAsScope);
      const values = Object.values(contextAsScope);
      const functionBody = `return (${js})`;
      const evaluatedFn = new Function(...keys, functionBody);
      const result = evaluatedFn(...values);
      return result ?? "";
    } catch (exception) {
      console.warn('Error evaluating expression', exception);
      return "";
    }
  }

  private async resolveInternally(unresolvedInput: any, valuesMap: any, censorConnections: boolean): Promise<any> {
    if (unresolvedInput === undefined || unresolvedInput === null) {
      return unresolvedInput;
    } else if (isString(unresolvedInput)) {
      return this.resolveInput(unresolvedInput, valuesMap, censorConnections);
    } else if (Array.isArray(unresolvedInput)) {
      for (let i = 0; i < unresolvedInput.length; ++i) {
        unresolvedInput[i] = await this.resolveInternally(unresolvedInput[i], valuesMap, censorConnections);
      }
    } else if (typeof unresolvedInput === 'object') {
      const entries = Object.entries(unresolvedInput);
      for (let i = 0; i < entries.length; ++i) {
        const [key, value] = entries[i];
        unresolvedInput[key] = await this.resolveInternally(value, valuesMap, censorConnections);
      }
    }
    return unresolvedInput;
  }

  private getExecutionStateObject(executionState: ExecutionState): Record<string, unknown> {
    const valuesMap: Record<string, unknown> = {}
    Object.entries(executionState.lastStepState).forEach(([key, value]) => {
      valuesMap[key] = value;
    });
    return valuesMap;
  }

  resolve(params: ResolveParams): Promise<any> {
    const { unresolvedInput, executionState, censorConnections } = params

    return this.resolveInternally(
      JSON.parse(JSON.stringify(unresolvedInput)),
      this.getExecutionStateObject(executionState),
      censorConnections
    );
  }

  castedToNumber(number: any): number | undefined | null {
    if (isNil(number)) {
      return number;
    }
    if (number === '') {
      return NaN;
    }
    return Number(number);
  }

  getISODateTime = (clonedInput: any, key: string): string | undefined => {
    dayjs.extend(utc);
    dayjs.extend(timezone);
    const dateTimeString = clonedInput[key];
    try {
      const dateTimeString = clonedInput[key];
      if (!dateTimeString) throw Error('Undefined input');
      return dayjs.tz(dateTimeString, 'UTC').toISOString();
    } catch (error) {
      console.error(`Error while parsing ${dateTimeString}`, error);
      return undefined;
    }
  };

  validateAndCast(
    resolvedInput: any,
    props: PiecePropertyMap
  ): { result: any; errors: Record<string, any> } {
    const errors: Record<string, string | Record<string, string>> = {};
    const clonedInput = JSON.parse(JSON.stringify(resolvedInput));

    for (const [key, value] of Object.entries(resolvedInput)) {
      const property = props[key];
      const type = property?.type;
      if (type === PropertyType.NUMBER) {
        const castedNumber = this.castedToNumber(clonedInput[key]);
        // If the value is required, we don't allow it to be undefined or null
        if ((isNil(castedNumber) || isNaN(castedNumber)) && property.required) {
          errors[key] = `expected number, but found value: ${value}`;
        }
        // If the value is not required, we allow it to be undefined or null
        if (!isNil(castedNumber) && isNaN(castedNumber) && !property.required) {
          errors[key] = `expected number, but found value: ${value}`;
        }
        clonedInput[key] = castedNumber;
      } else if (type === PropertyType.CUSTOM_AUTH) {
        const innerValidation = this.validateAndCast(value, property.props);
        clonedInput[key] = innerValidation.result;
        if (Object.keys(innerValidation.errors).length > 0) {
          errors[key] = innerValidation.errors;
        }
      } else if (type === PropertyType.DATE_TIME) {
        const inferredDateTime = this.getISODateTime(clonedInput, key);
        if (isNil(inferredDateTime) && property.required) {
          errors[key] = `expected ISO string, but found value: ${value}`;
        }
        clonedInput[key] = inferredDateTime;
      }
    }

    return {
      result: clonedInput,
      errors
    };
  }
}
