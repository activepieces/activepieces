import { ExecutionState, isNil, isString } from "@activepieces/shared";
import { connectionService } from "./connections.service";
import { ApFile, PiecePropertyMap, PropertyType, formatErrorMessage, ErrorMessages, Validators } from "@activepieces/pieces-framework";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import path from "path";
import isBase64 from 'is-base64';
import { AnyValidators } from "packages/pieces/framework/src/lib/validators/types";
import { AnyProcessors } from "packages/pieces/framework/src/lib/processors/types";

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
    const connectionName = paths[1];
    paths.splice(0, 1);
    // Replace connection name with something that doesn't contain - or _, otherwise evalInScope would break
    paths[0] = 'connection';
    const newPath = paths.join(".");
    const connection = (await connectionService.obtain(connectionName));
    if (paths.length === 1) {
      return connection;
    }
    const context: Record<string, unknown> = {};
    context['connection'] = connection;
    return this.evalInScope(newPath, context);
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
    if (isNil(unresolvedInput)) {
      return unresolvedInput;
    }

    if (isString(unresolvedInput)) {
      return this.resolveInput(unresolvedInput, valuesMap, censorConnections);
    }

    if (Array.isArray(unresolvedInput)) {
      for (let i = 0; i < unresolvedInput.length; ++i) {
        unresolvedInput[i] = await this.resolveInternally(unresolvedInput[i], valuesMap, censorConnections);
      }
    }
    else if (typeof unresolvedInput === 'object') {
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

  resolve<T = unknown>(params: ResolveParams): Promise<T> {
    const { unresolvedInput, executionState, censorConnections } = params

    if (isNil(unresolvedInput)) {
      return Promise.resolve(unresolvedInput) as Promise<T>
    }

    return this.resolveInternally(
      JSON.parse(JSON.stringify(unresolvedInput)),
      this.getExecutionStateObject(executionState),
      censorConnections
    ) as Promise<T>
  }

  async applyProcessorsAndValidators(
    resolvedInput: any,
    props: PiecePropertyMap
  ): Promise<{ processedInput: any; errors: any; }> {
    const processedInput = { ...resolvedInput };
    const errors: any = {};
  
    for (const [key, value] of Object.entries(resolvedInput)) {
      const property = props[key];
      const type = property.type;
  
      const processors = [...(property.defaultProcessors || []), ...(property.processors || [])];
      const validators = [...(property.defaultValidators || []), ...(property.validators || [])];
  
      switch (type) {
        case PropertyType.CUSTOM_AUTH: {
          const { processedInput: innerProcessedInput, errors: innerErrors } = await this.applyProcessorsAndValidators(value, property.props);
          processedInput[key] = innerProcessedInput;
          if (Object.keys(innerErrors).length > 0) {
            errors[key] = innerErrors;
          }
          break;
        }
        default: {
          for (const processor of processors) {
            processedInput[key] = await processor(property, value);
          }
          
          const propErrors = [];
          // Short Circuit
          // If the value is required, we don't allow it to be undefined or null
          if (isNil(value) && property.required) {
            errors[key] = [formatErrorMessage(ErrorMessages.REQUIRED, { userInput: value })]
            break
          };
          // If the value is not required, we allow it to be undefined or null
          if (isNil(value) && !property.required) break;

          for (const validator of validators) {
            const error = validator(property, processedInput[key], value);
            if (!isNil(error)) propErrors.push(error);
          }
          if (propErrors.length) errors[key] = propErrors;
          break;
        }
      }
    }

    return { processedInput, errors };
  }
}

type ResolveParams = {
  unresolvedInput: unknown
  executionState: ExecutionState
  censorConnections: boolean
}

type ResolveAndValidateParams = ResolveParams & {
  actionProps: PiecePropertyMap
}
