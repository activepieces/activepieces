import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { getCallLogActionOutputSchema } from '../output-schemas';

export const getCallLogAction = createAction({
	auth: pipedriveAuth,
	name: 'get-call-log',
	outputSchema: getCallLogActionOutputSchema,
	classification: 'READ',
	displayName: 'Get Call Log',
	description: 'Retrieves one call log by its ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Reads one call log by its ID - outcome, duration, phone numbers and the linked person, organization or deal. Get the ID from List Call Logs. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		callLogId: Property.ShortText({
			displayName: 'Call Log ID',
			description: 'The 32-character hexadecimal call log ID (from List Call Logs or Add Call Log).',
			required: true,
		}),
	},
	async run(context) {
		const callLogId = pipedriveAtomic.assertCallLogId(context.propsValue.callLogId);
		return pipedriveAtomic.call<PipedriveEnvelope<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/v1/callLogs/${callLogId}`,
			resourceLabel: `Call log ${callLogId}`,
		});
	},
});
