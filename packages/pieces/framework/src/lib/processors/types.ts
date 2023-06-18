import { PieceProperty } from "../property";
import { Processors } from "./processors";

export type ProcessorFn<INPUT, OUTPUT> = (property: PieceProperty, value: INPUT) => OUTPUT;

export type NumberProcessors = typeof Processors.number;
export type DateTimeProcessors = typeof Processors.datetime;
export type FileProcessors = typeof Processors.file;
export type AnyProcessors = NumberProcessors | DateTimeProcessors | FileProcessors
