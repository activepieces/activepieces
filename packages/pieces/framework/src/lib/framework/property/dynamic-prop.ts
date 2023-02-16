import { PropertyType } from "@activepieces/shared";
import { BasePropertySchema, NumberProperty, ShortTextProperty, TPropertyValue } from "./base-prop";
import { StaticDropdownProperty } from "./dropdown-prop";

type DynamicProp = ShortTextProperty<true> | NumberProperty<true> | StaticDropdownProperty<any, true>;

export type DynamicPropsValue = Record<string, DynamicProp['valueSchema']>;

export type DynamicPropsSchema = BasePropertySchema & {
	props?: Record<string, DynamicProp>;
	refreshers: string[];
}

export type DynamicPropeties<R extends boolean> = DynamicPropsSchema & TPropertyValue<
	DynamicPropsValue,
	PropertyType.DYNAMIC,
	R
>;
