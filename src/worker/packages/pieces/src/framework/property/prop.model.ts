
export type PropsValue = Record<string, any>;

export enum PropertyType {
	SHORT_TEXT = 'SHORT_TEXT',
	LONG_TEXT = 'LONG_TEXT',
	DROPDOWN = 'DROPDOWN',
	NUMBER = 'NUMBER',
	CHECKBOX = 'CHECKBOX',
	OAUTH2 = 'OAUTH2'
}


export type Property =
	| ShortTextProperty
	| LongTextProperty
	| DropdownProperty
	| OAuth2Property
	| NumberProperty
	| CheckboxProperty;


export type OAuth2Property = BasicProperty<PropertyType.OAUTH2> & {
	authUrl: string;
	tokenUrl: string;
	scope: string[];
};

export type ShortTextProperty = BasicProperty<PropertyType.SHORT_TEXT>;

export type NumberProperty = BasicProperty<PropertyType.NUMBER>;


type BasicProperty<U extends PropertyType> = {
	name: string;
	displayName: string;
	description: string | undefined;
	required: boolean;
	type: U;
};

export type CheckboxProperty = BasicProperty<PropertyType.CHECKBOX>;
export type LongTextProperty = BasicProperty<PropertyType.LONG_TEXT>;

export type DropdownProperty = BasicProperty<PropertyType.DROPDOWN> & {
	options: (auth: PropsValue) => Promise<DropdownState>;
};

export type DropdownState = {
	disabled?: boolean;
	options: DropdownOption[];
}

export type DropdownOption = {
	label: string;
	value: string;
};
