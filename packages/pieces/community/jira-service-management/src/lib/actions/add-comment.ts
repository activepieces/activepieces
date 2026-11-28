import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { jsmAuth, jsmConnection } from '../auth';
import { JsmDate, JsmUser, jsmClient } from '../common/client';
import { jsmProps } from '../common/props';
import { jsmUsers } from '../common/users';
import { commentOutputSchema } from '../output-schemas';

export const addCommentAction = createAction({
	auth: jsmAuth,
	name: 'add_comment',
	classification: 'WRITE',
	displayName: 'Add Comment',
	description: 'Adds a reply to the customer or an internal note to a request.',
	audience: 'both',
	aiMetadata: {
		description:
			'Add a comment to a Jira Service Management request, either as a public reply the customer sees or as an internal note only agents see. Pick the visibility carefully: a public reply notifies the customer. Each call adds a new comment, so a retry duplicates it.',
		idempotent: false,
	},
	outputSchema: commentOutputSchema,
	propertyGroups: [
		{
			key: 'request',
			display: 'section',
			label: 'Request',
			icon: 'inbox',
			props: ['requestKey'],
		},
		{
			key: 'comment',
			display: 'section',
			label: 'Comment',
			icon: 'text',
			props: ['visibility', 'body'],
		},
	],
	props: {
		requestKey: jsmProps.request(),
		visibility: Property.StaticDropdown({
			displayName: 'Visibility',
			required: true,
			defaultValue: 'public',
			display: 'cards',
			options: {
				options: [
					{ label: 'Public reply', value: 'public', description: 'To customer', icon: 'reply' },
					{ label: 'Internal note', value: 'internal', description: 'Team only', icon: 'users' },
				],
			},
		}),
		body: Property.LongText({
			displayName: 'Comment',
			placeholder: 'We are looking into this and will update you soon.',
			required: true,
		}),
	},
	async run(context) {
		const { requestKey, visibility, body } = context.propsValue;
		const key = requestKey.trim();
		const comment = await jsmClient.request<JsmComment>({
			auth: jsmConnection.toProps(context.auth),
			api: 'servicedesk',
			method: HttpMethod.POST,
			path: `/request/${encodeURIComponent(key)}/comment`,
			body: { body, public: visibility !== 'internal' },
		});
		return {
			comment_id: comment.id ?? null,
			issue_key: key,
			body: comment.body ?? null,
			public: comment.public ?? null,
			author_name: comment.author?.displayName ?? null,
			author_email: comment.author?.emailAddress ?? null,
			author_account_id: comment.author?.accountId ?? null,
			author_username: jsmUsers.usernameOf(comment.author),
			created_at: comment.created?.iso8601 ?? null,
		};
	},
});

type JsmComment = {
	id?: string;
	body?: string;
	public?: boolean;
	author?: JsmUser | null;
	created?: JsmDate;
};
