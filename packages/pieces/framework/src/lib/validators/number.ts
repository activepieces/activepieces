import { ErrorMessages } from './errors';
import { ValidatorFn } from "./types";
import { formatErrorMessage } from "./utils";

export const numberValidator: ValidatorFn = (property, processedValue, userInput) => {

  if (isNaN(processedValue)) {
    return formatErrorMessage(ErrorMessages.NUMBER, { userInput });
  }

  return null;
}

export function minValueValidator(min: number): ValidatorFn {
  return (property, processedValue, userInput) => {
    const isValid = Number(processedValue) >= Number(min);

    if (isValid) return null;

    return formatErrorMessage(ErrorMessages.MIN, { userInput, min });

  }
}

export function maxValueValidator(max: number): ValidatorFn {
  return (property, processedValue, userInput) => {
    const isValid = Number(processedValue) <= Number(max);

    if (isValid) return null;

    return formatErrorMessage(ErrorMessages.MAX, { userInput, max });

  }
}

export function inRangeValidator(min:number, max: number): ValidatorFn {
  return (property, processedValue, userInput) => {
    const isValid = Number(processedValue) <= Number(max) && Number(processedValue) >= Number(min);

    if (isValid) return null;

    return formatErrorMessage(ErrorMessages.IN_RANGE, { userInput, min, max });

  }
}
