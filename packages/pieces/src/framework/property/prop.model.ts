
type BasicPropertySchema = {
	displayName: string;
	description?: string;
	required: boolean;
};

type TextPropertySchema = BasicPropertySchema & {
	/**
	 * Whether the text input contains sensitive data, e.g. a password or an API key.
	 */
	secret: boolean;
};

type DropdownPropertySchema<T> = BasicPropertySchema & {
	refreshers: string[];
	options: (propsValue: Record<string, OAuth2PropertyValue | number | string | DropdownState<any>>) => Promise<DropdownState<T>>
}

type OAuth2PropertySchema = BasicPropertySchema & {
	authUrl: string;
	tokenUrl: string;
	scope: string[];
	extra?: Record<string, unknown>;
}

type ApiKeyPropertySchema = BasicPropertySchema & {
	apiKey: string;
}

export enum PropertyType {
	SHORT_TEXT = 'SHORT_TEXT',
	LONG_TEXT = 'LONG_TEXT',
	DROPDOWN = 'DROPDOWN',
	NUMBER = 'NUMBER',
	CHECKBOX = 'CHECKBOX',
	OAUTH2 = 'OAUTH2',
	API_KEY = 'API_KEY',
}

type TPropertyValue<T, U> = {
	valueSchema: T | undefined
	type: U;
}

export interface LongTextProperty extends TextPropertySchema, TPropertyValue<string, PropertyType.LONG_TEXT> {
}

export interface CheckboxProperty extends BasicPropertySchema, TPropertyValue<string, PropertyType.CHECKBOX> {
}

export interface ShortTextProperty extends TextPropertySchema, TPropertyValue<string, PropertyType.SHORT_TEXT> {
}

export interface NumberProperty extends BasicPropertySchema, TPropertyValue<number, PropertyType.NUMBER> {
}

export type OAuth2PropertyValue = {
	access_token: string;
	data: Record<string, any>
}

export interface OAuth2Property extends OAuth2PropertySchema, TPropertyValue<OAuth2PropertyValue, PropertyType.OAUTH2> {
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

export type ApiKeyPropertyValue = {
	apiKey: string;
}

export interface ApiKeyProperty extends ApiKeyPropertySchema, TPropertyValue<ApiKeyPropertyValue, PropertyType.API_KEY> {}

export interface PieceProperty {
	[name: string]: ShortTextProperty
		| LongTextProperty
		| OAuth2Property
		| CheckboxProperty
		| DropdownProperty<any>
		| NumberProperty
		| ApiKeyProperty;
}

export type StaticPropsValue<T extends PieceProperty> = {
	[P in keyof T]: T[P]['valueSchema'];
}

export const Property = {
	ShortText(request: TextPropertySchema): ShortTextProperty {
		return {...request, valueSchema: undefined, type: PropertyType.SHORT_TEXT};
	},
	Checkbox(request: BasicPropertySchema): CheckboxProperty {
		return {...request, valueSchema: undefined, type: PropertyType.CHECKBOX};
	},
	LongText(request: TextPropertySchema): LongTextProperty {
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
	ApiKey(request: ApiKeyPropertySchema): ApiKeyProperty {
		return {...request, valueSchema: undefined, type: PropertyType.API_KEY};
	},
}
