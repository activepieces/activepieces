import { Property } from '@activepieces/pieces-framework';
import { Operator } from './constants';

export const operatorStaticDropdown = Property.StaticDropdown({
	displayName: 'Comparison Type',
	description: 'How to compare the battery power in watts',
	required: true,
	defaultValue: Operator.GREATER_THAN,
	options: {
		options: [
			{ label: 'Less than', value: Operator.LESS_THAN },
			{ label: 'Less than or equal to', value: Operator.LESS_THAN_OR_EQUAL },
			{ label: 'Equal to', value: Operator.EQUAL },
			{
				label: 'Greater than or equal to',
				value: Operator.GREATER_THAN_OR_EQUAL,
			},
			{ label: 'Greater than', value: Operator.GREATER_THAN },
		],
	},
});

export const verificationTokenInput = Property.ShortText({
	displayName: 'Verification Token',
	description: 'Token for webhook verification.',
	required: true,
	defaultValue: 'token',
});
