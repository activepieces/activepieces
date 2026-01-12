import { Type } from "@sinclair/typebox";
import { StaticDropdownProperty, StaticMultiSelectDropdownProperty } from "./dropdown/static-dropdown";
import { ShortTextProperty } from "./text-property";
import { BasePropertySchema, TPropertyValue } from "./common";
import { AppConnectionValueForAuthProperty, PropertyContext } from "../../context";
import { PropertyType } from "./property-type";
import { JsonProperty } from "./json-property";
import { ArrayProperty } from "./array-property";
import { ExtractPieceAuthPropertyTypeForMethods, InputPropertyMap, PieceAuthProperty } from "..";

export const DynamicProp = Type.Union([
  ShortTextProperty,
  StaticDropdownProperty,
  JsonProperty,
  ArrayProperty,
  StaticMultiSelectDropdownProperty,
])

export type DynamicProp =
  | ShortTextProperty<boolean>
  | StaticDropdownProperty<any, boolean>
  | JsonProperty<boolean>
  | ArrayProperty<boolean>
  | StaticMultiSelectDropdownProperty<any, boolean>;

export const DynamicPropsValue = Type.Record(Type.String(), DynamicProp);

export type DynamicPropsValue = Record<string, DynamicProp['valueSchema']>;

export const DynamicProperties = Type.Composite([
  Type.Object({
    refreshers: Type.Array(Type.String()),
  }),
  BasePropertySchema,
  TPropertyValue(Type.Unknown(), PropertyType.DYNAMIC),
])

export type DynamicProperties<R extends boolean, PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = undefined> = BasePropertySchema &
{
   //dummy property to define auth property value inside props value
  auth: PieceAuth
  props: DynamicPropertiesOptions<PieceAuth>
  refreshers: string[];
} &
  TPropertyValue<
    DynamicPropsValue,
    PropertyType.DYNAMIC,
    R
  >;

  type DynamicPropertiesOptions<PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = undefined> = (
    propsValue: Record<string, unknown> & {
      auth?: AppConnectionValueForAuthProperty<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>>;
    },
    ctx: PropertyContext,
  ) => Promise<InputPropertyMap>;
