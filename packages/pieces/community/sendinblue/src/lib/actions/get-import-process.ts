import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { getImportProcessActionOutputSchema } from '../output-schemas';

export const getImportProcess = createAction({
	auth: sendinblueAuth,
	name: 'get_import_process',
	outputSchema: getImportProcessActionOutputSchema,
	classification: 'READ',
	displayName: 'Get Import Process',
	description: 'Check the status of a background process such as an import.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Reads the current status of one Brevo background process by the id that Import Contacts returned. Status is one of queued, processing, completed, failed or cancelled; a completed import also carries links to CSV files listing invalid emails and duplicate records. This is a single status read, not a wait — call it again after a delay while the status is still queued or processing. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		process_id: Property.Number({
			displayName: 'Process ID',
			description: 'The process id returned by Import Contacts.',
			required: true,
		}),
	},
	async run(context) {
		const { process_id } = context.propsValue;

		const process = await brevoCommon.apiCall<ProcessResponse>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/processes/${process_id}`,
		});

		return {
			id: process.id ?? process_id,
			status: process.status,
			finished: process.status === 'completed' || process.status === 'failed',
			name: process.name,
			export_url: process.export_url,
		};
	},
});

type ProcessResponse = {
	id?: number;
	status?: string;
	name?: string;
	export_url?: string;
};
