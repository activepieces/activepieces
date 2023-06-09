import { isEmpty } from "lodash";
import { PieceProperty } from "../property";
import { ErrorMessages } from './errors';
import { ValidatorFn, formatErrorMessage } from "./validators";

export function emailValidator(property: PieceProperty, processedValue: any, userInput: any): string | null {
  const pattern = new RegExp('^(([^<>()\\[\\]\\.,;:\\s@\"]+(\\.[^<>()\\[\\]\\.,;:\\s@\"]+)*)|(\".+\"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$');
  if (isEmpty(processedValue)) {
    return null;
  }

  if (isEmpty(processedValue)) return null;

  return pattern.test(String(processedValue))
  ? null 
  : formatErrorMessage(ErrorMessages.EMAIL, { userInput });
}

export function urlValidator(property: PieceProperty, processedValue: any, userInput: any): string | null {
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

export function patternValidator(regex: string | RegExp): ValidatorFn {
  return (property: PieceProperty, processedValue: any, userInput: any): string | null => {

    if (isEmpty(processedValue)) return null;

    if (typeof regex === 'string') {
      regex = new RegExp(regex);
    }
  
    return regex.test(String(processedValue))
      ? null
      : formatErrorMessage(ErrorMessages.IMAGE, { property: property.displayName});    

  }
}
