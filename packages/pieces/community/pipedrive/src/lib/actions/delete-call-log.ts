import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';

export const deleteCallLogAction = createAction({
	auth: pipedriveAuth,
	name: 'delete-call-log',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Call Log',
	description: 'Deletes one call log.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Deletes one call log by its ID, along with any attached recording. The call activity Pipedrive created with the log is kept; remove it separately with Delete Activity if needed. This cannot be undone from this piece. Not safe to retry blindly.',
		idempotent: false,
	},
	props: {
		callLogId: Property.ShortText({
			displayName: 'Call Log ID',
			description: 'The 32-character hexadecimal ID of the call log to delete (from List Call Logs).',
			required: true,
		}),
	},
	async run(context) {
		const callLogId = pipedriveAtomic.assertCallLogId(context.propsValue.callLogId);
		return pipedriveAtomic.call<PipedriveEnvelope<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			resourceUri: `/v1/callLogs/${callLogId}`,
			resourceLabel: `Call log ${callLogId}`,
		});
	},
});
