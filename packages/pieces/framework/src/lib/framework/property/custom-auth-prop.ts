import { PropertyType } from "@activepieces/shared";
import { BasePropertySchema, NumberProperty, SecretTextProperty, ShortTextProperty, TPropertyValue } from "./base-prop";
import { StaticDropdownProperty } from "./dropdown-prop";

type CustomAuthProp = ShortTextProperty<boolean> | SecretTextProperty<boolean> | NumberProperty<boolean> | StaticDropdownProperty<unknown, boolean>;

export type CustomAuthPropsValue = Record<string, CustomAuthProp['valueSchema']>;

export type CustomAuthPropertySchema = BasePropertySchema & {
	props: Record<string, CustomAuthProp>
}

export type CustomAuthPropertyValue = {
	props: CustomAuthPropsValue,
}

export type CustomAuthProperty<R extends boolean> = CustomAuthPropertySchema & TPropertyValue<
	CustomAuthPropertyValue,
	PropertyType.CUSTOM_AUTH,
	R
>;
