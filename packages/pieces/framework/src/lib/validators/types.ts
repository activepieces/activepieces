import { PieceProperty } from '../property';

export type ValidationErrors = Record<
  string,
  string[] | Record<string, string[]>
>;

export type ValidatorFn = (
  property: PieceProperty,
  processedValue: any,
  userInput: any
) => string | null;

export enum ValidationInputType {
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  FILE = 'FILE',
  ANY = 'ANY',
  DATE_TIME = 'DATE_TIME',
  OBJECT = 'OBJECT',
  ARRAY = 'ARRAY',
  JSON = 'JSON',
}

export type TypedValidatorFn<T extends ValidationInputType> = {
  type: T;
  fn: ValidatorFn;
};
