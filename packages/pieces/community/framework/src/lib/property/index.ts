import { InputProperty } from './input';
import { PieceAuthProperty } from './authentication';
import { Type } from '@sinclair/typebox';

// EXPORTED 

export { ApFile } from './input/file-property';
export { DropdownProperty, MultiSelectDropdownProperty } from './input/dropdown/dropdown-prop';
export { DropdownState } from './input/dropdown/common';
export { DynamicProperties } from './input/dynamic-prop';
export { PropertyType } from './input/property-type';
export { Property } from './input';
export { PieceAuth } from './authentication';

export const PieceProperty = Type.Union([InputProperty, PieceAuthProperty])
export type PieceProperty = InputProperty | PieceAuthProperty;

export const PiecePropertyMap = Type.Record(Type.String(), PieceProperty)
export interface PiecePropertyMap {
  [name: string]: PieceProperty;
}

export const InputPropertyMap = Type.Record(Type.String(), InputProperty)
export interface InputPropertyMap {
  [name: string]: InputProperty;
}

export type PiecePropValueSchema<T extends PieceProperty> =
  T extends undefined
  ? undefined
  : T extends { required: true }
  ? T['valueSchema']
  : T['valueSchema'] | undefined;

export type StaticPropsValue<T extends PiecePropertyMap> = {
  [P in keyof T]: PiecePropValueSchema<T[P]>;
};

