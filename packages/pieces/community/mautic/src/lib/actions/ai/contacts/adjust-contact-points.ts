import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticAdjustContactPointsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticAdjustContactPointsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_adjust_contact_points',
	outputSchema: mauticAdjustContactPointsOutputSchema,
	displayName: 'Adjust Contact Points',
	description: 'Adds, subtracts, multiplies or divides the points of a Mautic contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes a contact's total points by applying the operator with the value, e.g. Add 10. Each call applies again, so repeating it changes the score again. Use Adjust Contact Group Points for a point group score.",
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts or Create Contact.',
		}),
		operator: Property.StaticDropdown({
			displayName: 'Operator',
			required: true,
			options: {
				options: [
					{ label: 'Add', value: 'plus' },
					{ label: 'Subtract', value: 'minus' },
					{ label: 'Multiply', value: 'times' },
					{ label: 'Divide', value: 'divide' },
				],
			},
		}),
		value: Property.Number({ displayName: 'Value', required: true }),
		eventName: Property.ShortText({
			displayName: 'Event Name',
			description: 'Label shown in the contact points history.',
			required: false,
		}),
		actionName: Property.ShortText({
			displayName: 'Action Name',
			description: 'Action label shown in the contact points history.',
			required: false,
		}),
	},
	async run(context) {
		return await mauticApi.adjustContactPoints({
			auth: context.auth,
			id: context.propsValue.id,
			operator: context.propsValue.operator,
			delta: context.propsValue.value,
			body: {
				...spreadIfDefined('eventName', context.propsValue.eventName),
				...spreadIfDefined('actionName', context.propsValue.actionName),
			},
		});
	},
});
