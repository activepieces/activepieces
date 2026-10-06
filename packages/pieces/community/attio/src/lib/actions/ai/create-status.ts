import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioCreateStatusOutputSchema } from '../../output-schemas';

export const attioCreateStatusAction = createAction({
	auth: attioAuth,
	name: 'attio_create_status',
	outputSchema: attioCreateStatusOutputSchema,
	displayName: 'Create Status',
	description: 'Adds a status to a status attribute.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Adds a new status, e.g. a deal stage, to a status attribute. Statuses cannot be deleted, only archived with Update Status. Not idempotent.',
		idempotent: false,
	},
	props: {
		target: attioAi.targetProp(),
		identifier: attioAi.identifierProp(),
		attribute: attioAi.attributeProp(),
		title: Property.ShortText({ displayName: 'Title', required: true }),
		celebration_enabled: Property.Checkbox({ displayName: 'Celebration Enabled', description: 'Show a celebration when a record reaches this status.', required: false }),
		target_time_in_status: Property.ShortText({ displayName: 'Target Time in Status', description: 'ISO 8601 duration, e.g. `P7D`.', required: false }),
	},
	async run(context) {
		const { target, identifier, attribute, title, celebration_enabled, target_time_in_status } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/${target}/${identifier}/attributes/${attribute}/statuses`,
			body: { data: { title, celebration_enabled: celebration_enabled ?? false, target_time_in_status: target_time_in_status ?? null } },
		});
		return response.data;
	},
});
