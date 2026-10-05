import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioCreateSelectOptionOutputSchema } from '../../output-schemas';

export const attioUpdateSelectOptionAction = createAction({
	auth: attioAuth,
	name: 'attio_update_select_option',
	outputSchema: attioCreateSelectOptionOutputSchema,
	displayName: 'Update Select Option',
	description: 'Renames or archives a select option.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Renames or archives a select option; omitted fields are unchanged.',
		idempotent: true,
	},
	props: {
		target: attioAi.targetProp(),
		identifier: attioAi.identifierProp(),
		attribute: attioAi.attributeProp(),
		option: Property.ShortText({ displayName: 'Option', description: 'Option ID or title, from List Select Options.', required: true }),
		title: Property.ShortText({ displayName: 'Title', required: false }),
		is_archived: attioAi.optionalBooleanProp({ displayName: 'Archived', description: 'Yes archives the option; No restores it.' }),
	},
	async run(context) {
		const { target, identifier, attribute, option, title, is_archived } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.PATCH,
			resourceUri: `/${target}/${identifier}/attributes/${attribute}/options/${option}`,
			body: { data: attioAi.compact({ title, is_archived: attioAi.toBoolean(is_archived) }) },
		});
		return response.data;
	},
});
