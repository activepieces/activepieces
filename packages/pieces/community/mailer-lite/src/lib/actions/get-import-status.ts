import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteApi } from '../common/client';
import { importStatusOutputSchema } from '../output-schemas';

export const getImportStatusAction = createAction({
	auth: mailerLiteAuth,
	name: 'get_import_status',
	classification: 'READ',
	displayName: 'Get Import Status',
	description: 'Get the progress and report of a subscriber import.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Check the progress of a subscriber import started by import_subscribers_to_group, given its import_id. Makes one read and does not wait: if done is false, call it again later. When done, the report counts imported, updated and errored rows. Read-only and idempotent.',
		idempotent: true,
	},
	outputSchema: importStatusOutputSchema,
	props: {
		import_id: Property.ShortText({
			displayName: 'Import ID',
			description: 'The import ID returned by import_subscribers_to_group.',
			required: true,
		}),
	},
	async run(context) {
		const id = mailerLiteApi.requireId({ value: context.propsValue.import_id, label: 'Import ID' });
		const body = await mailerLiteApi.request<unknown>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/subscribers/import/${id}`,
			resource: `import ${id}`,
		});
		return mailerLiteApi.unwrapData(body);
	},
});
