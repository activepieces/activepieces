import { get, isNil, isString } from "lodash";
import { ExecutionState } from "@activepieces/shared";
import { connectionService } from "./connections.service";
import { ApFile, PiecePropertyMap, PropertyType } from "@activepieces/pieces-framework";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import axios from "axios";
import path from "path";
import isBase64 from 'is-base64';

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

  castToNumber(number: any): number | undefined | null {
    if (isNil(number)) {
      return number;
    }
    if (number === '') {
      return NaN;
    }
    return Number(number);
  }

  convertUrlOrBase64ToFile = async (urlOrBase64: unknown): Promise<ApFile | null> => {
    if (isNil(urlOrBase64) || !isString(urlOrBase64)) {
      return null;
    }
    // Get the file from the URL
    try {
      const response = await axios.head(urlOrBase64);


      // Check if the string is a Base64 string
      if (isBase64(urlOrBase64, { allowMime: true })) {
        const matches = urlOrBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        let base64 = urlOrBase64;
        let contentType = null;

        if (matches && matches?.length === 3) {
          contentType = matches[1];
          base64 = matches[2];
  
          // You need to provide how you decide filename and extension in case of base64 string
          const filename = 'unknown';
          const extension = contentType.split('/')[1];
  
          return {
            filename: filename + "." + extension,
            extension,
            base64,
          };
        }

      }
      const contentType = response.headers['content-type'];

      // Check if content type is file
      if (!contentType || !(contentType.startsWith('application/') || contentType.startsWith("image") || contentType === 'application/octet-stream')) {
        return null;
      }
      const fileResponse = await axios.get(urlOrBase64, {
        responseType: 'arraybuffer',
      });

      // Get filename and extension
      const filename = path.basename(urlOrBase64);
      // Remove dot from extension
      const extension = path.extname(urlOrBase64)?.substring(1);
      // Convert file data to base64
      const base64 = Buffer.from(fileResponse.data, 'binary').toString('base64');

      // Return the ApFile object
      return {
        filename,
        extension,
        base64,
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  };

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

  async validateAndCast(
    resolvedInput: any,
    props: PiecePropertyMap
  ): Promise<{ result: any; errors: Record<string, any>; }> {
    const errors: Record<string, string | Record<string, string>> = {};
    const clonedInput = JSON.parse(JSON.stringify(resolvedInput));

    for (const [key, value] of Object.entries(resolvedInput)) {
      const property = props[key];
      const type = property?.type;
      if (type === PropertyType.FILE) {
        const file = await this.convertUrlOrBase64ToFile(value);
        if (isNil(file) && property.required) {
          errors[key] = `expected file url or base64 with mimeType, but found value: ${value}`;
        }
        if (isNil(file) && !isNil(value) && value !== '' && !property.required) {
          errors[key] = `expected file url or base64 with mimeType, but found value: ${value}`;
        }
        clonedInput[key] = file;
      } else if (type === PropertyType.NUMBER) {
        const castedNumber = this.castToNumber(clonedInput[key]);
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
        const innerValidation = await this.validateAndCast(value, property.props);
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
