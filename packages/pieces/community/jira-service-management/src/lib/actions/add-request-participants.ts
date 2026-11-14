import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { jsmAuth, jsmConnection } from '../auth';
import { JsmUser, jsmClient } from '../common/client';
import { jsmProps } from '../common/props';
import { jsmUsers } from '../common/users';
import { participantsOutputSchema } from '../output-schemas';

export const addRequestParticipantsAction = createAction({
	auth: jsmAuth,
	name: 'add_request_participants',
	classification: 'WRITE',
	displayName: 'Add Request Participants',
	description: 'Shares a request with more people so they can follow and comment.',
	audience: 'both',
	aiMetadata: {
		description:
			'Add people as participants of a Jira Service Management request, so they see it and get its updates. Returns the full participant list after the change. Adding someone who already participates changes nothing, so it is safe to retry.',
		idempotent: true,
	},
	outputSchema: participantsOutputSchema,
	props: {
		requestKey: jsmProps.request(),
		participants: Property.Array({
			displayName: 'Participants',
			description: 'Emails of the people to add. Data Center: their usernames.',
			required: true,
		}),
	},
	async run(context) {
		const auth = jsmConnection.toProps(context.auth);
		const key = context.propsValue.requestKey.trim();
		const ids = await jsmUsers.resolveMany({ auth, values: jsmUsers.toList(context.propsValue.participants) });
		if (ids.length === 0) {
			throw new Error('Add at least one person in the Participants field.');
		}
		await jsmClient.request<unknown>({
			auth,
			api: 'servicedesk',
			method: HttpMethod.POST,
			path: `/request/${encodeURIComponent(key)}/participant`,
			body: jsmUsers.peopleBody({ auth, ids }),
		});
		const participants = await jsmClient.paginate<JsmUser>({
			auth,
			path: `/request/${encodeURIComponent(key)}/participant`,
			limit: 200,
		});
		return { issue_key: key, participants: participants.map((user) => jsmUsers.flatten(user)) };
	},
});
