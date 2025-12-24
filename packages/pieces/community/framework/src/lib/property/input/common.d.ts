import { Static, TObject, TSchema } from "@sinclair/typebox";
import { ApFile } from "./file-property";
import { PropertyType } from "./property-type";
export declare const BasePropertySchema: TObject<{
    displayName: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type BasePropertySchema = Static<typeof BasePropertySchema>;
export declare const TPropertyValue: <T extends TSchema, U extends PropertyType>(T: T, propertyType: U) => TObject;
export type TPropertyValue<T, U extends PropertyType, REQUIRED extends boolean> = {
    valueSchema: T;
    type: U;
    required: REQUIRED;
    defaultValue?: U extends PropertyType.ARRAY ? unknown[] : U extends PropertyType.JSON ? object : U extends PropertyType.CHECKBOX ? boolean : U extends PropertyType.LONG_TEXT ? string : U extends PropertyType.SHORT_TEXT ? string : U extends PropertyType.NUMBER ? number : U extends PropertyType.DROPDOWN ? unknown : U extends PropertyType.MULTI_SELECT_DROPDOWN ? unknown[] : U extends PropertyType.STATIC_MULTI_SELECT_DROPDOWN ? unknown[] : U extends PropertyType.STATIC_DROPDOWN ? unknown : U extends PropertyType.DATE_TIME ? string : U extends PropertyType.FILE ? ApFile : U extends PropertyType.COLOR ? string : unknown;
};
