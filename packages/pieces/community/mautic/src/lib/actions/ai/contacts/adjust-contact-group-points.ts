import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticAdjustContactGroupPointsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticAdjustContactGroupPointsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_adjust_contact_group_points',
	outputSchema: mauticAdjustContactGroupPointsOutputSchema,
	displayName: 'Adjust Contact Group Points',
	description: 'Changes the score of a Mautic contact in one point group.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes the contact's score in one point group by the operator and value, or sets it with Set. Add, Subtract, Multiply and Divide apply again on every call; Set is the only repeatable choice. Needs Mautic 5.1 or later.",
		idempotent: false,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts or Create Contact.',
		}),
		groupId: mauticAiProps.recordId({
			displayName: 'Point Group Id',
			description: 'Point group id, from List Contact Point Groups.',
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
					{ label: 'Set', value: 'set' },
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
		return await mauticApi.adjustContactGroupPoints({
			auth: context.auth,
			id: context.propsValue.id,
			groupId: context.propsValue.groupId,
			operator: context.propsValue.operator,
			value: context.propsValue.value,
			body: {
				...spreadIfDefined('eventName', context.propsValue.eventName),
				...spreadIfDefined('actionName', context.propsValue.actionName),
			},
		});
	},
});
