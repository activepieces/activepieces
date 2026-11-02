import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { deleteSegmentOutputSchema } from '../output-schemas';

export const deleteSegmentAction = createAction({
	auth: mailerLiteAuth,
	name: 'delete_segment',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Segment',
	description: 'Delete a segment.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently delete a MailerLite segment by ID. Only the segment definition is removed; the subscribers it matched are kept. Cannot be undone, and segments cannot be recreated through the API. Get the ID from list_segments. Not idempotent: a repeat call returns a 404 error.',
		idempotent: false,
	},
	outputSchema: deleteSegmentOutputSchema,
	props: {
		segment_id: Property.ShortText({
			displayName: 'Segment ID',
			description: 'The segment ID, from list_segments.',
			required: true,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.segment_id, label: 'Segment ID' });
		await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.DELETE,
			path: `/segments/${id}`,
			resource: `segment ${id}`,
		});
		return { deleted: true, segment_id: context.propsValue.segment_id.trim() };
	},
});
