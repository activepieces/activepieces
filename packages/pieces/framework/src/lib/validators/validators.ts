import { isEmpty, isNil } from "lodash";
import { ErrorMessages } from './errors';
import { ValidatorFn, ValidationErrors } from "./types";
import { formatErrorMessage } from "./utils";

class Validators {

  static pattern(regex: string | RegExp): ValidatorFn {
    return (property, processedValue, userInput): string | null => {

      if (isEmpty(processedValue)) return null;

      if (typeof regex === 'string') {
        regex = new RegExp(regex);
      }

      return regex.test(String(processedValue))
        ? null
        : formatErrorMessage(ErrorMessages.REGEX, { property: property.displayName });
    };
  }

  static maxLength(max: number, includeBounds = false): ValidatorFn {
    return (property, processedValue, userInput): string | null => {

      if (isEmpty(processedValue)) return null

      const isValid = includeBounds ? processedValue.length < max : processedValue.length <= max

      if (!isValid) {
        return formatErrorMessage(ErrorMessages.MAX_LENGTH, { userInput, length: max.toString() });
      }

      return null;
    };
  }

  static minLength(min: number, includeBounds = false): ValidatorFn {
    return (property, processedValue, userInput): string | null => {

      if (isEmpty(processedValue)) return null
      const isValid = includeBounds ? processedValue.length > min : processedValue.length >= min

      if (!isValid) {
        return formatErrorMessage(ErrorMessages.MIN_LENGTH, { userInput, length: min.toString() });
      }

      return null;
    };
  }

  static minValue(min: number, includeBounds = false): ValidatorFn {
    return (property, processedValue, userInput) => {
      const isValid = includeBounds ? Number(processedValue) > min : processedValue.length >= min

      if (isValid) return null;

      return formatErrorMessage(ErrorMessages.MIN, { userInput, min });

    };
  }

  static maxValue(max: number, includeBounds = false): ValidatorFn {
    return (property, processedValue, userInput) => {
      const isValid = includeBounds ? Number(processedValue) < max : processedValue.length <= max

      if (isValid) return null;

      return formatErrorMessage(ErrorMessages.MAX, { userInput, max });

    };
  }

  static inRange(min: number, max: number, includeBounds = false): ValidatorFn {
    return (property, processedValue, userInput) => {
      const numericValue = Number(processedValue);
      const isValid =
        (includeBounds ? numericValue <= max : numericValue < max) &&
        (includeBounds ? numericValue >= min : numericValue > min);

      if (isValid) return null;

      return formatErrorMessage(ErrorMessages.IN_RANGE, { userInput, min, max });
    };
  }

  static number: ValidatorFn = (property, processedValue, userInput) => {

    if (isNaN(processedValue)) {
      return formatErrorMessage(ErrorMessages.NUMBER, { userInput });
    }

    return null;
  }

  static image: ValidatorFn = (property, processedValue, userInput) => {
    const regex = /\.(jpg|svg|jpeg|png|bmp|gif|webp)$/i;

    return regex.test((processedValue as File).name)
      ? null
      : formatErrorMessage(ErrorMessages.IMAGE, { property: property.displayName });
  };

  static email: ValidatorFn = (property, processedValue, userInput) => {

    const pattern = new RegExp('^(([^<>()\\[\\].,;:\\s@"]+(\\.[^<>()\\[\\].,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z-0-9]+\\.)+[a-zA-Z]{2,}))$');

    if (isEmpty(processedValue)) {
      return null;
    }

    if (isEmpty(processedValue)) return null;

    return pattern.test(String(processedValue))
      ? null
      : formatErrorMessage(ErrorMessages.EMAIL, { userInput });
  }

  static url: ValidatorFn = (property, processedValue, userInput) => {

    const pattern = new RegExp(
      '^((https?|ftp|file)://)?' + // protocol
      '((([a-zA-Z\\d]([a-zA-Z\\d-]*[a-zA-Z\\d])*)\\.)+[a-zA-Z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-zA-Z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-zA-Z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-zA-Z\\d_]*)?$' // fragment locator
    );
    if (isEmpty(processedValue)) return null;

    return pattern.test(String(processedValue))
      ? null
      : formatErrorMessage(ErrorMessages.URL, { userInput });
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
    return (property, processedValue, userInput) => {

      if (Array.isArray(values)) {
        return values.includes(processedValue)
          ? null
          : formatErrorMessage(ErrorMessages.ONE_OF, { userInput, choices: values });
      }

      return null

    };
  }
}

export {
  Validators,
  ErrorMessages,
  ValidationErrors,
  formatErrorMessage,
}
