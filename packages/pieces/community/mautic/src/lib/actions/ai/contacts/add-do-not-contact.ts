import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticAddDoNotContactOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticAddDoNotContactAction = createAction({
	auth: mauticAuth,
	name: 'mautic_add_do_not_contact',
	outputSchema: mauticAddDoNotContactOutputSchema,
	displayName: 'Add Do Not Contact',
	description: 'Marks a Mautic contact as do not contact on a channel.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a do-not-contact entry for a contact on the email or SMS channel, so Mautic stops sending on that channel. Remove it with Remove Do Not Contact.',
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
		reason: Property.StaticDropdown({
			displayName: 'Reason',
			description: 'Defaults to Manual.',
			required: false,
			options: {
				options: [
					{ label: 'Unsubscribed', value: 1 },
					{ label: 'Bounced', value: 2 },
					{ label: 'Manual', value: 3 },
				],
			},
		}),
		channelId: Property.Number({
			displayName: 'Channel Id',
			description: 'Id of the email or text message that caused the entry.',
			required: false,
		}),
		comments: Property.LongText({ displayName: 'Comments', required: false }),
	},
	async run(context) {
		const { id, channel, reason, channelId, comments } = context.propsValue;
		return await mauticApi.setDoNotContact({
			auth: context.auth,
			id,
			channel,
			change: 'add',
			body: {
				...spreadIfDefined('reason', reason),
				...spreadIfDefined('channelId', channelId),
				...spreadIfDefined('comments', comments),
			},
		});
	},
});
