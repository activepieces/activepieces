import { isNil } from "lodash";
import { PieceProperty } from "../property";
import { ErrorMessages } from './errors';
import { emailValidator, patternValidator, urlValidator } from "./regex";
import { imageValidator } from "./file";
import { inRangeValidator, maxValueValidator, minValueValidator, numberValidator } from "./number";
import { maxLengthValidator, minLengthValidator } from "./text";
import { ValidatorFn, ValidationErrors } from "./types";
import { formatErrorMessage } from "./utils";

export { ErrorMessages, ValidationErrors, formatErrorMessage }

export class Validators {

  static number: ValidatorFn = (property, processedValue, userInput) => {
    return numberValidator(property, processedValue, userInput)
  }

  static maxLength(max: number): ValidatorFn {
    return maxLengthValidator(max);
  }

  static minLength(min: number): ValidatorFn {
    return minLengthValidator(min);
  }

  static minValue(min: number): ValidatorFn {
    return minValueValidator(min);
  }

  static maxValue(max: number): ValidatorFn {
    return maxValueValidator(max);
  }

  static inRange(min:number, max: number): ValidatorFn {
    return inRangeValidator(min, max);
  }

  static image: ValidatorFn = (property, processedValue, userInput) => {
    return imageValidator(property, processedValue, userInput);
  };

  static email(property: PieceProperty, processedValue: any, userInput: any): string | null {
    return emailValidator(property, processedValue, userInput);
  }

  static url(property: PieceProperty, processedValue: any, userInput: any): string | null {
    return urlValidator(property, processedValue, userInput)
  }

  static pattern(regex: string | RegExp): ValidatorFn {
    return patternValidator(regex);
  }

  static datetimeIso: ValidatorFn = (property, processedValue, userInput) => {

    if (property.required && isNil(processedValue)) {
      return formatErrorMessage(ErrorMessages.ISO_DATE, { userInput });
    }

    return null;
  }

  static file: ValidatorFn = (property, processedValue, userInput) => {

    if (property.required && isNil(processedValue)) {
      return formatErrorMessage(ErrorMessages.FILE, { userInput });
    }

    return null;
  }

  static oneOf(values: unknown[]): ValidatorFn {
    return (property: PieceProperty, processedValue: any, userInput: any) => {
  
      if (Array.isArray(values)) {
        return values.includes(processedValue)
          ? null
          : formatErrorMessage(ErrorMessages.ONE_OF, { userInput, choices: values });
      }

      return null

    };
  }
}
