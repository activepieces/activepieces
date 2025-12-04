import { BasePropertySchema, TPropertyValue } from "../common";
import { DropdownState } from "./common";
import { AppConnectionValueForAuthProperty, PropertyContext } from "../../../context";
import { Type } from "@sinclair/typebox";
import { PropertyType } from "../property-type";
import { PieceAuthProperty } from "../../authentication";

type DynamicDropdownOptions<T, PieceAuth extends PieceAuthProperty | PieceAuthProperty[] |  undefined = undefined> = (
  propsValue: Record<string, unknown> & {
    auth?: PieceAuth extends undefined ? undefined : AppConnectionValueForAuthProperty<Exclude<PieceAuth, undefined>>;
  },
  ctx: PropertyContext,
) => Promise<DropdownState<T>>;

export const DropdownProperty = Type.Composite([
  BasePropertySchema,
  TPropertyValue(Type.Unknown(), PropertyType.DROPDOWN),
  Type.Object({
    refreshers: Type.Array(Type.String()),
  }),
]);

export type DropdownProperty<T, R extends boolean, PieceAuth extends PieceAuthProperty | PieceAuthProperty[] |  undefined = undefined> = BasePropertySchema & {
  /**
   * A dummy property used to infer {@code PieceAuth} type
   */
  auth: PieceAuth;
  refreshers: string[];
  refreshOnSearch?: boolean;
  options: DynamicDropdownOptions<T, PieceAuth>;
} & TPropertyValue<T, PropertyType.DROPDOWN, R>;


export const MultiSelectDropdownProperty = Type.Composite([
  BasePropertySchema,
  TPropertyValue(Type.Array(Type.Unknown()), PropertyType.MULTI_SELECT_DROPDOWN),
  Type.Object({
    refreshers: Type.Array(Type.String()),
  }),
]);

export type MultiSelectDropdownProperty<
  T,
  R extends boolean,
  PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = undefined
> = BasePropertySchema & {
  /**
   * A dummy property used to infer {@code PieceAuth} type
   */
  auth: PieceAuth;
  refreshers: string[];
  refreshOnSearch?: boolean;
  options: DynamicDropdownOptions<T, PieceAuth>;
} & TPropertyValue<
  T[],
  PropertyType.MULTI_SELECT_DROPDOWN,
  R
>;
