import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { segmentOutputSchema } from '../output-schemas';

export const renameSegmentAction = createAction({
	auth: mailerLiteAuth,
	name: 'rename_segment',
	classification: 'WRITE',
	displayName: 'Rename Segment',
	description: 'Rename a segment.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Rename a MailerLite segment by ID. Only the name changes; the segment rules are untouched. Get the ID from list_segments. Idempotent.',
		idempotent: true,
	},
	outputSchema: segmentOutputSchema,
	props: {
		segment_id: Property.ShortText({
			displayName: 'Segment ID',
			description: 'The segment ID, from list_segments.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The new segment name (max 255 characters).',
			required: true,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.segment_id, label: 'Segment ID' });
		const name = context.propsValue.name.trim();
		if (!name) {
			throw new Error('Name is required.');
		}
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.PUT,
			path: `/segments/${id}`,
			resource: `segment ${id}`,
			body: { name },
		});
		return mailerLiteApi.unwrapData(body);
	},
});
