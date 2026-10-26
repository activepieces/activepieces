import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxGetGroupMmsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_group_mms',
	displayName: 'Get Group MMS',
	description: 'Gets every per-recipient message of a group MMS.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the individual messages that make up a group MMS, one per recipient with its delivery status. Use the id returned by Send Group MMS.',
		idempotent: true,
	},
	props: {
		messageId: Property.ShortText({
			displayName: 'Group Message ID',
			description: 'ID returned by Send Group MMS.',
			required: true,
		}),
	},
	async run(context) {
		const messages = await telnyxApi.getGroupMms({
			auth: context.auth,
			messageId: context.propsValue.messageId,
		});
		return { messages, count: messages.length };
	},
});
