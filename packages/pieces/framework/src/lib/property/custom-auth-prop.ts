import { PropertyType } from "./property";
import { BasePropertySchema, CheckboxProperty, LongTextProperty, NumberProperty, SecretTextProperty, ShortTextProperty, TPropertyValue } from "./base-prop";
import { StaticDropdownProperty } from "./dropdown-prop";
import { StaticPropsValue } from "./property";
import { NumberProcessors } from "../processors/types";
import { NumberValidators, StringValidators } from "../validators/types";


export interface CustomAuthProps {
	[name: string]: ShortTextProperty<boolean> | LongTextProperty<boolean> | SecretTextProperty<boolean> | NumberProperty<boolean> | StaticDropdownProperty<unknown, boolean> | CheckboxProperty<boolean>;
}

export type CustomAuthPropertyValue<T extends CustomAuthProps> = StaticPropsValue<T>;

export type CustomAuthPropertySchema<T> = BasePropertySchema & {
	props: T
}

export type CustomAuthProperty<R extends boolean, T extends CustomAuthProps> = CustomAuthPropertySchema<T> & TPropertyValue<
	CustomAuthPropertyValue<T>,
	NumberProcessors,
	NumberValidators | StringValidators,
	PropertyType.CUSTOM_AUTH,
	R
>;
