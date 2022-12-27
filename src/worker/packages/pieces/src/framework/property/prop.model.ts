
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
	| ShortTextInput
	| LongTextInput
	| SelectInput
	| OAuth2Input
	| NumberInput
	| CheckboxInput;


export type OAuth2Input = BasicProperty<PropertyType.OAUTH2> & {
	authUrl: string;
	tokenUrl: string;
	scope: string[];
};

export type ShortTextInput = BasicProperty<PropertyType.SHORT_TEXT>;

export type NumberInput = BasicProperty<PropertyType.NUMBER>;


type BasicProperty<U extends PropertyType> = {
	name: string;
	displayName: string;
	description: string | undefined;
	required: boolean;
	type: U;
};

export type CheckboxInput = BasicProperty<PropertyType.CHECKBOX>;
export type LongTextInput = BasicProperty<PropertyType.LONG_TEXT>;

export type SelectInput = BasicProperty<PropertyType.DROPDOWN> & {
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
