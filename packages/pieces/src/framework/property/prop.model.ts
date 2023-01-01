
type BasicPropertySchema = {
	displayName: string;
	description?: string;
	required: boolean;
};

type DropdownPropertySchema<T> = BasicPropertySchema & {
	options: (propsValue: Record<string, AuthPropertyValue | number | string | DropdownState<any>>) => Promise<DropdownState<T>>
}

type OAuth2PropertySchema = BasicPropertySchema & {
	authUrl: string;
	tokenUrl: string;
	scope: string[];
	extra?: Record<string, unknown>
}

export enum PropertyType {
	SHORT_TEXT = 'SHORT_TEXT',
	LONG_TEXT = 'LONG_TEXT',
	DROPDOWN = 'DROPDOWN',
	NUMBER = 'NUMBER',
	CHECKBOX = 'CHECKBOX',
	OAUTH2 = 'OAUTH2'
}

type TPropertyValue<T, U> = {
	valueSchema: T | undefined
	type: U;
}

export interface LongTextProperty extends BasicPropertySchema, TPropertyValue<string, PropertyType.LONG_TEXT> {
}

export interface CheckboxProperty extends BasicPropertySchema, TPropertyValue<string, PropertyType.CHECKBOX> {
}

export interface ShortTextProperty extends BasicPropertySchema, TPropertyValue<string, PropertyType.SHORT_TEXT> {
}

export interface NumberProperty extends BasicPropertySchema, TPropertyValue<number, PropertyType.NUMBER> {
}

export type AuthPropertyValue = {
	access_token: string;
	data: Record<string, any>
}

export interface OAuth2Property extends OAuth2PropertySchema, TPropertyValue<AuthPropertyValue, PropertyType.OAUTH2> {
}

export type DropdownState<T> = {
	disabled?: boolean;
	placeholder?: string;
	options: DropdownOption<T>[];
}

export type DropdownOption<T>= {
	label: string;
	value: T;
};

export interface DropdownProperty<T> extends DropdownPropertySchema<T>, TPropertyValue<T, PropertyType.DROPDOWN> {}

export interface PieceProperty {
	[name: string]: ShortTextProperty
		| LongTextProperty
		| OAuth2Property
		| CheckboxProperty
		| DropdownProperty<any>
		| NumberProperty;
}

export type StaticPropsValue<T extends PieceProperty> = {
	[P in keyof T]: T[P]['valueSchema'];
}

export const Property = {
	ShortText(request: BasicPropertySchema): ShortTextProperty {
		return {...request, valueSchema: undefined, type: PropertyType.SHORT_TEXT};
	},
	Checkbox(request: BasicPropertySchema): CheckboxProperty {
		return {...request, valueSchema: undefined, type: PropertyType.CHECKBOX};
	},
	LongText(request: BasicPropertySchema): LongTextProperty {
		return {...request, valueSchema: undefined, type: PropertyType.LONG_TEXT};
	},
	Number(request: BasicPropertySchema): NumberProperty {
		return {...request, valueSchema: undefined, type: PropertyType.NUMBER};
	},
	OAuth2(request: OAuth2PropertySchema): OAuth2Property {
		return {...request, valueSchema: undefined, type: PropertyType.OAUTH2};
	},
	Dropdown<T>(request: DropdownPropertySchema<T>): DropdownProperty<T> {
		return {...request, valueSchema: undefined, type: PropertyType.DROPDOWN};
	},
}
