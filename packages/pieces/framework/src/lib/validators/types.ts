import { PieceProperty } from "../property";
import { Validators } from "./validators";

export type ValidationErrors = Record<string, string[] | Record<string, string[]>>;

export type ValidatorFn = (property: PieceProperty, processedValue: any, userInput: any) => string | null;

export type GeneralValidators = typeof Validators.oneOf;
export type NumberValidators = GeneralValidators | typeof Validators.number | typeof Validators.minValue | typeof Validators.inRange | typeof Validators.maxValue;
export type StringValidators = GeneralValidators | typeof Validators.minLength | typeof Validators.maxLength | typeof Validators.email | typeof Validators.url | typeof Validators.pattern;
export type DateTimeValidators = GeneralValidators | typeof Validators.datetimeIso;
export type FileValidators = GeneralValidators | typeof Validators.image | typeof Validators.file;
export type AnyValidators = GeneralValidators | FileValidators | NumberValidators | StringValidators | DateTimeValidators
