import { PieceProperty } from '../property';
import { Processors } from './processors';

export type ProcessorFn<INPUT = any, OUTPUT = any> = (
  property: PieceProperty,
  value: INPUT
) => OUTPUT;

export type NumberProcessors = typeof Processors.number;
export type DateTimeProcessors = typeof Processors.datetime;
export type FileProcessors = typeof Processors.file;
export type AnyProcessors =
  | NumberProcessors
  | DateTimeProcessors
  | FileProcessors;
