import dayjs, { OpUnitType } from 'dayjs';
import { isEmpty, isInteger, isNil, isString } from 'lodash';
import { ErrorMessages } from './errors';
import {
  TypedValidatorFn,
  ValidationErrors,
  ValidationInputType,
} from './types';
import { formatErrorMessage } from './utils';
import { ApFile } from '../property';

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

  static prohibitPattern(
    regex: string | RegExp
  ): TypedValidatorFn<ValidationInputType.STRING> {
    return {
      type: ValidationInputType.STRING,
      fn: (property, processedValue, userInput) => {
        const patternValidator = Validators.pattern(regex);
        const patternError = patternValidator.fn(
          property,
          processedValue,
          userInput
        );
        return patternError
          ? null
          : formatErrorMessage(ErrorMessages.PROHIBIT_REGEX, {
            property: property.displayName,
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

  static minDate(
    min: string,
    unit: OpUnitType = 'day',
    includeBounds = false
  ): TypedValidatorFn<ValidationInputType.DATE_TIME> {
    return {
      type: ValidationInputType.DATE_TIME,
      fn: (property, processedValue, userInput) => {
        const dateValue = dayjs(processedValue);
        const minDate = dayjs(min);
        if (!minDate.isValid()) return null;

        const isValid = includeBounds
          ? dateValue.isAfter(minDate, unit)
          : dateValue.isSame(minDate, unit) && dateValue.isAfter(minDate, unit);

        if (isValid) return null;

        return formatErrorMessage(ErrorMessages.MIN_DATE, {
          userInput: dateValue.toISOString(),
          min: minDate.toISOString(),
        });
      },
    };
  }

  static maxDate(
    max: string,
    unit: OpUnitType = 'day',
    includeBounds = false
  ): TypedValidatorFn<ValidationInputType.DATE_TIME> {
    return {
      type: ValidationInputType.DATE_TIME,
      fn: (property, processedValue, userInput) => {
        const dateValue = dayjs(processedValue);
        const maxDate = dayjs(max);
        if (!maxDate.isValid()) return null;

        const isValid = includeBounds
          ? dateValue.isBefore(maxDate, unit)
          : dateValue.isSame(maxDate, unit) &&
          dateValue.isBefore(maxDate, unit);

        if (isValid) return null;

        return formatErrorMessage(ErrorMessages.MAX_DATE, {
          userInput: dateValue.toISOString(),
          max: maxDate.toISOString(),
        });
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

  static inDateRange(
    min: string,
    max: string,
    unit: OpUnitType = 'day',
    includeBounds = false
  ): TypedValidatorFn<ValidationInputType.DATE_TIME> {
    return {
      type: ValidationInputType.DATE_TIME,
      fn: (property, processedValue) => {
        const dateValue = dayjs(processedValue);
        const minDate = dayjs(min);
        const maxDate = dayjs(max);
        const validRanges = minDate.isValid() && maxDate.isValid();
        if (!validRanges) return null;

        const isValid = includeBounds
          ? (dateValue.isBefore(maxDate, unit) ||
            dateValue.isSame(maxDate, unit)) &&
          (dateValue.isAfter(minDate, unit) ||
            dateValue.isSame(minDate, unit))
          : dateValue.isBefore(maxDate, unit) &&
          dateValue.isAfter(minDate, unit);

        if (isValid) return null;

        return formatErrorMessage(ErrorMessages.IN_RANGE, {
          userInput: dateValue.toISOString(),
          min: minDate.toISOString(),
          max: maxDate.toISOString(),
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

  static string: TypedValidatorFn<ValidationInputType.STRING> = {
    type: ValidationInputType.STRING,
    fn: (property, processedValue, userInput) => {
      if (!isString(processedValue)) {
        return formatErrorMessage(ErrorMessages.STRING, { userInput })
      }

      return null;
    }
  }

  static nonZero: TypedValidatorFn<ValidationInputType.NUMBER> = {
    type: ValidationInputType.NUMBER,
    fn: (property, processedValue, userInput) => {
      if (processedValue === 0) {
        return formatErrorMessage(ErrorMessages.NON_ZERO, { userInput });
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
      const allowedType = ['jpg', 'png', 'gif', 'webp', 'flif', 'cr2', 'tif', 'bmp', 'jxr', 'psd', 'ico', 'bpg', 'jp2', 'jpm', 'jpx', 'heic', 'cur', 'dcm', 'avif'];
      const ext = (processedValue as ApFile).extension;
      return allowedType.includes(ext ?? '')
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

  static phoneNumber: TypedValidatorFn<ValidationInputType.STRING> = {
    type: ValidationInputType.STRING,
    fn: (property, processedValue, userInput) => {
      const pattern = new RegExp(
        '^\\+?\\d{1,4}?[-.\\s]?\\(?\\d{1,3}?\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9}$'
      );
      if (isEmpty(processedValue)) return null;

      return pattern.test(String(processedValue))
        ? null
        : formatErrorMessage(ErrorMessages.PHONE_NUMBER, { userInput });
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

export { ErrorMessages, ValidationErrors, Validators, formatErrorMessage };
