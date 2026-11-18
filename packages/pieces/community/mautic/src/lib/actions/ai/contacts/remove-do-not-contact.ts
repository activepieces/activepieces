import { Property, createAction } from '@activepieces/pieces-framework';

import { mauticRemoveDoNotContactOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticRemoveDoNotContactAction = createAction({
	auth: mauticAuth,
	name: 'mautic_remove_do_not_contact',
	outputSchema: mauticRemoveDoNotContactOutputSchema,
	displayName: 'Remove Do Not Contact',
	description: 'Removes the do not contact entry of a Mautic contact on a channel.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Removes the do-not-contact entry of a contact on the email or SMS channel, so Mautic can send on it again.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts or Create Contact.',
		}),
		channel: Property.StaticDropdown({
			displayName: 'Channel',
			required: true,
			options: {
				options: [
					{ label: 'Email', value: 'email' },
					{ label: 'SMS', value: 'sms' },
				],
			},
		}),
	},
	async run(context) {
		return await mauticApi.setDoNotContact({
			auth: context.auth,
			id: context.propsValue.id,
			channel: context.propsValue.channel,
			change: 'remove',
		});
	},
});
