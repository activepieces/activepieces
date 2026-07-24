import { intercomAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomClient } from '../common';
import dayjs from 'dayjs';

export const createDataEventAction = createAction({
	auth: intercomAuth,
	name: 'create-data-event',
	displayName: 'Create Data Event',
	description: 'Submits a data event for a contact.',
	audience: 'both',
	aiMetadata: {
		description:
			'Submit a data (tracking) event against a contact, identified by their Intercom ID, external User ID, or email. Records something the contact did (an event name) with an optional metadata payload of string values. Each call logs a new event, so it is not idempotent.',
		idempotent: false,
	},
	props: {
		identifierType: Property.StaticDropdown({
			displayName: 'Identify Contact By',
			required: true,
			defaultValue: 'email',
			options: {
				disabled: false,
				options: [
					{ label: 'Email', value: 'email' },
					{ label: 'Intercom Contact ID', value: 'id' },
					{ label: 'User ID', value: 'user_id' },
				],
			},
		}),
		identifierValue: Property.ShortText({
			displayName: 'Identifier Value',
			required: true,
		}),
		eventName: Property.ShortText({
			displayName: 'Event Name',
			description: 'The name of the event that occurred.',
			required: true,
		}),
		createdAt: Property.DateTime({
			displayName: 'Created At',
			description: 'When the event happened. Defaults to now if left empty.',
			required: false,
		}),
		metadata: Property.Object({
			displayName: 'Metadata',
			description: 'Optional key/value pairs describing the event.',
			required: false,
		}),
	},
	async run(context) {
		const { identifierType, identifierValue, eventName, createdAt, metadata } =
			context.propsValue;

		const client = intercomClient(context.auth);

		const createdAtUnix = createdAt ? dayjs(createdAt).unix() : dayjs().unix();
		const stringMetadata = metadata
			? Object.fromEntries(
					Object.entries(metadata).map(([key, value]) => [key, String(value)]),
			  )
			: undefined;

		await client.events.create(
			identifierType === 'id'
				? { id: identifierValue, event_name: eventName, created_at: createdAtUnix, metadata: stringMetadata }
				: identifierType === 'user_id'
				? { user_id: identifierValue, event_name: eventName, created_at: createdAtUnix, metadata: stringMetadata }
				: { email: identifierValue, event_name: eventName, created_at: createdAtUnix, metadata: stringMetadata },
		);

		return { success: true };
	},
});
