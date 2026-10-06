import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { getFileSignedUrlOutputSchema } from '../output-schemas';

export const getFileSignedUrl = createAction({
	auth: mistralAuth,
	name: 'get_file_signed_url',
	classification: 'READ',
	displayName: 'Get File Download URL',
	description: 'Get a temporary link to download an uploaded file.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a time-limited signed URL (1 to 168 hours, default 24) that downloads one uploaded file without an API key. Use it to hand a file to another service by link; use Download File when the flow itself needs the bytes. Each call issues a new URL, but nothing is changed in the account.',
		idempotent: true,
	},
	outputSchema: getFileSignedUrlOutputSchema,
	props: {
		file_id: Property.ShortText({
			displayName: 'File ID',
			description: 'The file UUID, from List Files.',
			required: true,
		}),
		expiry_hours: Property.Number({
			displayName: 'Expiry (hours)',
			description: 'How long the link stays valid, between 1 and 168 hours.',
			required: false,
			defaultValue: 24,
		}),
	},
	async run(context) {
		const { file_id, expiry_hours } = context.propsValue;
		const expiry = expiry_hours ?? 24;
		const response = await mistralApi.call<{ url: string }>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/files/${encodeURIComponent(file_id)}/url`,
			queryParams: { expiry },
		});
		return {
			file_id,
			url: response.url,
			expires_at: new Date(Date.now() + expiry * 3600 * 1000).toISOString(),
		};
	},
});
