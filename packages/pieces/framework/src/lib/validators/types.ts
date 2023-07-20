import { PieceProperty } from "../property";

export type ValidationErrors = Record<string, string[] | Record<string, string[]>>;

export type ValidatorFn = (
  property: PieceProperty,
  processedValue: any,
  userInput: any
) => string | null;
