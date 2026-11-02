import { nocodbAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { nocodbListNotificationsOutputSchema } from '../output-schemas';

export const listNotificationsAction = createAction({
	auth: nocodbAuth,
	name: 'nocodb-list-notifications',
	outputSchema: nocodbListNotificationsOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Notifications',
	description: 'Returns the authenticated user\'s notifications.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the authenticated account\'s notifications. Leave Read Only unset to return all notifications regardless of read state, or check it to return only already-read ones; there is no unread-only filter. Use to check for recent activity across bases the account has access to. Idempotent read-only query.',
		idempotent: true,
	},
	props: {
		isRead: Property.Checkbox({
			displayName: 'Read Only',
			description: 'When checked, returns only already-read notifications. Leave unchecked to return all notifications (read and unread) — there is no unread-only filter.',
			required: false,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			required: false,
			defaultValue: 25,
		}),
		offset: Property.Number({
			displayName: 'Offset',
			required: false,
			defaultValue: 0,
		}),
	},
	async run(context) {
		const { isRead, limit, offset } = context.propsValue;
		const client = makeClient(context.auth);
		return await client.listNotifications(isRead, limit, offset);
	},
});
