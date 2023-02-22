import { PropertyType } from "@activepieces/shared";
import { BasePropertySchema, NumberProperty, ShortTextProperty, TPropertyValue } from "./base-prop";
import { StaticDropdownProperty } from "./dropdown-prop";

type DynamicProp = ShortTextProperty<boolean> | NumberProperty<boolean> | StaticDropdownProperty<any, boolean>;

export type DynamicPropsValue = Record<string, DynamicProp['valueSchema']>;

export type DynamicPropsSchema = BasePropertySchema & {
	props: (propsValue: Record<string, DynamicPropsValue>) => Promise<Record<string, DynamicProp>>;
	refreshers: string[];
}

export type DynamicProperties<R extends boolean> = DynamicPropsSchema & TPropertyValue<
	DynamicPropsValue,
	PropertyType.DYNAMIC,
	R
>;
