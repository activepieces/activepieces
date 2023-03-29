import { PropertyType } from "@activepieces/shared";
import { BasePropertySchema, NumberProperty, SecretTextProperty, ShortTextProperty, TPropertyValue } from "./base-prop";
import { StaticDropdownProperty } from "./dropdown-prop";
import { StaticPropsValue } from "./property";


export interface CustomAuthProps {
	[name: string]: ShortTextProperty<boolean> | SecretTextProperty<boolean> | NumberProperty<boolean> | StaticDropdownProperty<unknown, boolean>;
}

export type CustomAuthPropertyValue<T extends CustomAuthProps> = StaticPropsValue<T>;

export type CustomAuthPropertySchema<T> = BasePropertySchema & {
	props: T
}

export type CustomAuthProperty<R extends boolean, T extends CustomAuthProps> = CustomAuthPropertySchema<T> & TPropertyValue<
	CustomAuthPropertyValue<T>,
	PropertyType.CUSTOM_AUTH,
	R
>;
