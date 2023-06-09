import { PieceProperty } from "../property";
import { ErrorMessages } from './errors';
import { formatErrorMessage } from "./validators";

export function imageValidator(property: PieceProperty, processedValue: any, userInput: any): string | null {
  const regex = /\.(jpg|svg|jpeg|png|bmp|gif|webp)$/i;

  return regex.test((processedValue as File).name)
    ? null
    : formatErrorMessage(ErrorMessages.IMAGE, { property: property.displayName});
};
