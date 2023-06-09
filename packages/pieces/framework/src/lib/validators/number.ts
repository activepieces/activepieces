import { PieceProperty } from "../property";
import { ErrorMessages } from './errors';
import { ValidatorFn, formatErrorMessage } from "./validators";

export function numberValidator(property: PieceProperty, processedValue: any, userInput: any): string | null {

  if (isNaN(processedValue)) {
    return formatErrorMessage(ErrorMessages.NUMBER, { userInput });
  }

  return null;
}

export function minValueValidator(min: number): ValidatorFn {
  return (property: PieceProperty, processedValue: any, userInput: any): string | null => {
    const isValid = Number(processedValue) >= Number(min);

    if (isValid) return null;

    return formatErrorMessage(ErrorMessages.MIN, { userInput, min });

  }
}

export function maxValueValidator(max: number): ValidatorFn {
  return (property: PieceProperty, processedValue: any, userInput: any): string | null => {
    const isValid = Number(processedValue) <= Number(max);

    if (isValid) return null;

    return formatErrorMessage(ErrorMessages.MAX, { userInput, max });

  }
}

export function inRangeValidator(min:number, max: number): ValidatorFn {
  return (property: PieceProperty, processedValue: any, userInput: any): string | null => {
    const isValid = Number(processedValue) <= Number(max) && Number(processedValue) >= Number(min);

    if (isValid) return null;

    return formatErrorMessage(ErrorMessages.IN_RANGE, { userInput, min, max });

  }
}
