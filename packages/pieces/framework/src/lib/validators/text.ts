import { isEmpty } from "lodash";
import { PieceProperty } from "../property";
import { ErrorMessages } from './errors';
import { formatErrorMessage } from "./utils";
import { ValidatorFn } from "./types";

export function maxLengthValidator(max: number): ValidatorFn {
  return (property: PieceProperty, processedValue: any, userInput: any): string | null => {
    if (isEmpty(processedValue)) return null

    if (processedValue.length > max) {
      return formatErrorMessage(ErrorMessages.MAX_LENGTH, { userInput, length: max.toString() });
    }

    return null;
  };
}

export function minLengthValidator(min: number): ValidatorFn {
  return (property: PieceProperty, processedValue: any, userInput: any): string | null => {
    if (isEmpty(processedValue)) return null

    if (processedValue.length < min) {
      return formatErrorMessage(ErrorMessages.MIN_LENGTH, { userInput, length: min.toString() });
    }

    return null;
  };
}
