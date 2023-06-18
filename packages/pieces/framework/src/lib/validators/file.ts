import { ErrorMessages } from './errors';
import { ValidatorFn } from "./types";
import { formatErrorMessage } from "./utils";

export const imageValidator: ValidatorFn = (property, processedValue, userInput) => {
  const regex = /\.(jpg|svg|jpeg|png|bmp|gif|webp)$/i;

  return regex.test((processedValue as File).name)
    ? null
    : formatErrorMessage(ErrorMessages.IMAGE, { property: property.displayName});
};
