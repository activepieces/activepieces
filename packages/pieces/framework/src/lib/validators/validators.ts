import { isEmpty, isInteger, isNil } from 'lodash';
import { ErrorMessages } from './errors';
import {
  ValidationErrors,
  TypedValidatorFn,
  ValidationInputType,
} from './types';
import { formatErrorMessage } from './utils';

class Validators {
  static pattern(
    regex: string | RegExp
  ): TypedValidatorFn<ValidationInputType.STRING> {
    return {
      type: ValidationInputType.STRING,
      fn: (property, processedValue, userInput) => {
        if (isEmpty(processedValue)) return null;

        if (typeof regex === 'string') {
          regex = new RegExp(regex);
        }

        return regex.test(String(processedValue))
          ? null
          : formatErrorMessage(ErrorMessages.REGEX, {
              property: property?.displayName,
            });
      },
    };
  }

  static maxLength(max: number): TypedValidatorFn<ValidationInputType.STRING> {
    return {
      type: ValidationInputType.STRING,
      fn: (property, processedValue, userInput) => {
        if (isEmpty(processedValue)) return null;

        const isValid = processedValue.length <= max;

        if (!isValid) {
          return formatErrorMessage(ErrorMessages.MAX_LENGTH, {
            userInput,
            length: max.toString(),
          });
        }

        return null;
      },
    };
  }

  static minLength(min: number): TypedValidatorFn<ValidationInputType.STRING> {
    return {
      type: ValidationInputType.STRING,
      fn: (property, processedValue, userInput) => {
        if (isEmpty(processedValue)) return null;
        const isValid = processedValue.length >= min;

        if (!isValid) {
          return formatErrorMessage(ErrorMessages.MIN_LENGTH, {
            userInput,
            length: min.toString(),
          });
        }

        return null;
      },
    };
  }

  static minValue(min: number): TypedValidatorFn<ValidationInputType.NUMBER> {
    return {
      type: ValidationInputType.NUMBER,
      fn: (property, processedValue, userInput) => {
        const isValid = Number(processedValue) >= min;
        if (isValid) return null;
        return formatErrorMessage(ErrorMessages.MIN, { userInput, min });
      },
    };
  }

  static maxValue(max: number): TypedValidatorFn<ValidationInputType.NUMBER> {
    return {
      type: ValidationInputType.NUMBER,
      fn: (property, processedValue, userInput) => {
        const isValid = Number(processedValue) <= max;
        if (isValid) return null;

        return formatErrorMessage(ErrorMessages.MAX, { userInput, max });
      },
    };
  }

  static inRange(
    min: number,
    max: number
  ): TypedValidatorFn<ValidationInputType.NUMBER> {
    return {
      type: ValidationInputType.NUMBER,
      fn: (property, processedValue, userInput) => {
        const numericValue = Number(processedValue);
        const isValid = numericValue <= max && numericValue >= min;

        if (isValid) return null;

        return formatErrorMessage(ErrorMessages.IN_RANGE, {
          userInput,
          min,
          max,
        });
      },
    };
  }

  static number: TypedValidatorFn<ValidationInputType.NUMBER> = {
    type: ValidationInputType.NUMBER,
    fn: (property, processedValue, userInput) => {
      if (isNaN(processedValue)) {
        return formatErrorMessage(ErrorMessages.NUMBER, { userInput });
      }

      return null;
    },
  };

  static integer: TypedValidatorFn<ValidationInputType.NUMBER> = {
    type: ValidationInputType.NUMBER,
    fn: (property, processedValue, userInput) => {
      if (isInteger(processedValue)) {
        return formatErrorMessage(ErrorMessages.WHOLE_NUMBER, { userInput });
      }
      return null;
    },
  };

  static image: TypedValidatorFn<ValidationInputType.FILE> = {
    type: ValidationInputType.FILE,
    fn: (property, processedValue, userInput) => {
      const regex = /\.(jpg|svg|jpeg|png|bmp|gif|webp)$/i;

      return regex.test((processedValue as File).name)
        ? null
        : formatErrorMessage(ErrorMessages.IMAGE, { property: property });
    },
  };

  static email: TypedValidatorFn<ValidationInputType.STRING> = {
    type: ValidationInputType.STRING,
    fn: (property, processedValue, userInput) => {
      const pattern = new RegExp(
        '^(([^<>()\\[\\].,;:\\s@"]+(\\.[^<>()\\[\\].,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z-0-9]+\\.)+[a-zA-Z]{2,}))$'
      );

      if (isEmpty(processedValue)) {
        return null;
      }

      if (isEmpty(processedValue)) return null;

      return pattern.test(String(processedValue))
        ? null
        : formatErrorMessage(ErrorMessages.EMAIL, { userInput });
    },
  };

  static url: TypedValidatorFn<ValidationInputType.STRING> = {
    type: ValidationInputType.STRING,
    fn: (property, processedValue, userInput) => {
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
    },
  };

  static datetimeIso: TypedValidatorFn<ValidationInputType.DATE_TIME> = {
    type: ValidationInputType.DATE_TIME,
    fn: (property, processedValue, userInput) => {
      if (property.required && isNil(processedValue)) {
        return formatErrorMessage(ErrorMessages.ISO_DATE, { userInput });
      }
      return null;
    },
  };

  static file: TypedValidatorFn<ValidationInputType.FILE> = {
    type: ValidationInputType.FILE,
    fn: (property, processedValue, userInput) => {
      if (property.required && isNil(processedValue)) {
        return formatErrorMessage(ErrorMessages.FILE, { userInput });
      }
      return null;
    },
  };

  static oneOf(values: unknown[]): TypedValidatorFn<any> {
    return {
      type: ValidationInputType.ANY,
      fn: (property, processedValue, userInput) => {
        if (Array.isArray(values)) {
          return values.includes(processedValue)
            ? null
            : formatErrorMessage(ErrorMessages.ONE_OF, {
                userInput,
                choices: values,
              });
        }

        return null;
      },
    };
  }

  static requireKeys(
    values: string[]
  ): TypedValidatorFn<ValidationInputType.OBJECT> {
    return {
      type: ValidationInputType.OBJECT,
      fn: (property, processedValue, userInput) => {
        if (Array.isArray(values)) {
          const missingKeys = values.filter((key) => !processedValue[key]);
          return missingKeys.length
            ? formatErrorMessage(ErrorMessages.REQUIRE_KEYS, {
                userInput,
                keys: missingKeys.join(', '),
              })
            : null;
        }
        return null;
      },
    };
  }
}

export { Validators, ErrorMessages, ValidationErrors, formatErrorMessage };
