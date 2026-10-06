import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioCreateStatusOutputSchema } from '../../output-schemas';

export const attioUpdateStatusAction = createAction({
	auth: attioAuth,
	name: 'attio_update_status',
	outputSchema: attioCreateStatusOutputSchema,
	displayName: 'Update Status',
	description: 'Renames, configures or archives a status.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Updates only the supplied fields of a status; set Archived to Yes to archive it.',
		idempotent: true,
	},
	props: {
		target: attioAi.targetProp(),
		identifier: attioAi.identifierProp(),
		attribute: attioAi.attributeProp(),
		status: Property.ShortText({ displayName: 'Status', description: 'Status ID or title, from List Statuses.', required: true }),
		title: Property.ShortText({ displayName: 'Title', required: false }),
		celebration_enabled: attioAi.optionalBooleanProp({ displayName: 'Celebration Enabled', description: 'Leave empty to keep the current setting.' }),
		target_time_in_status: Property.ShortText({ displayName: 'Target Time in Status', description: 'ISO 8601 duration, e.g. `P7D`.', required: false }),
		is_archived: attioAi.optionalBooleanProp({ displayName: 'Archived', description: 'Yes archives the status; No restores it.' }),
	},
	async run(context) {
		const { target, identifier, attribute, status, title, celebration_enabled, target_time_in_status, is_archived } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.PATCH,
			resourceUri: `/${target}/${identifier}/attributes/${attribute}/statuses/${status}`,
			body: {
				data: attioAi.compact({
					title,
					celebration_enabled: attioAi.toBoolean(celebration_enabled),
					target_time_in_status,
					is_archived: attioAi.toBoolean(is_archived),
				}),
			},
		});
		return response.data;
	},
});
