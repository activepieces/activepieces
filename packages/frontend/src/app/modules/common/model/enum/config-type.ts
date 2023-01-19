import { ConfigType } from '@activepieces/shared';

export const configTypesDropdownOptions = [
	{
		label: 'Short Text',
		value: ConfigType.SHORT_TEXT,
		icon: 'short-text.svg',
		group: 'Text',
	},
	{
		label: 'Multiline Text',
		value: ConfigType.LONG_TEXT,
		icon: 'multiline-text.svg',
		group: 'Text',
	},
	{ label: 'Number', value: ConfigType.NUMBER, icon: 'number.svg', group: 'Number' },
	{
		label: 'Checkbox',
		value: ConfigType.CHECKBOX,
		icon: 'toggle.svg',
		group: 'Boolean',
	},
	{
		label: 'Dictionary',
		value: ConfigType.DICTIONARY,
		icon: 'key-value.svg',
		group: 'Others',
	},
];
