import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { importSubscribersOutputSchema } from '../output-schemas';

export const importSubscribersToGroupAction = createAction({
	auth: mailerLiteAuth,
	name: 'import_subscribers_to_group',
	classification: 'WRITE',
	displayName: 'Import Subscribers to Group',
	description: 'Start a bulk import of subscribers into a group.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Start a bulk import of subscribers into a MailerLite group. subscribers is a JSON array of objects, each with an email and an optional fields object. Existing subscribers are updated and added to the group. The import runs in the background and this action does not wait: it returns an import_id to pass to get_import_status to check progress. Limited to 5 imports per minute. Not idempotent: each call starts a new import.',
		idempotent: false,
	},
	outputSchema: importSubscribersOutputSchema,
	props: {
		group_id: Property.ShortText({
			displayName: 'Group ID',
			description: 'The group ID, from list_groups or find_groups_by_name.',
			required: true,
		}),
		subscribers: Property.Json({
			displayName: 'Subscribers',
			description: 'JSON array of subscribers, e.g. [{"email": "a@example.com", "fields": {"name": "Ann"}}].',
			required: true,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.group_id, label: 'Group ID' });
		const input: unknown = context.propsValue.subscribers;
		if (!Array.isArray(input) || input.length === 0) {
			throw new Error('Subscribers must be a non-empty JSON array.');
		}
		const subscribers = input.map((row: unknown, index: number) => {
			if (!mailerLiteApi.isRecord(row) || typeof row['email'] !== 'string' || !row['email'].trim()) {
				throw new Error(`Subscriber at position ${index + 1} must have an email.`);
			}
			const fields = row['fields'];
			return mailerLiteApi.isRecord(fields) ? { email: row['email'].trim(), fields } : { email: row['email'].trim() };
		});
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			path: `/groups/${id}/import-subscribers`,
			resource: `group ${id}`,
			body: { subscribers },
		});
		const url = mailerLiteApi.isRecord(body) && typeof body['import_progress_url'] === 'string' ? body['import_progress_url'] : '';
		const importId = url.split('/').filter((segment) => segment.length > 0).pop() ?? '';
		return { import_id: importId, import_progress_url: url };
	},
});
