import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioGetAttributeOutputSchema } from '../../output-schemas';

export const attioUpdateAttributeAction = createAction({
	auth: attioAuth,
	name: 'attio_update_attribute',
	outputSchema: attioGetAttributeOutputSchema,
	displayName: 'Update Attribute',
	description: 'Updates or archives an attribute.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Updates only the supplied fields of an attribute. Set Archived to Yes to archive it (the API has no delete).',
		idempotent: true,
	},
	props: {
		target: attioAi.targetProp(),
		identifier: attioAi.identifierProp(),
		attribute: attioAi.attributeProp(),
		title: Property.ShortText({ displayName: 'Title', required: false }),
		api_slug: Property.ShortText({ displayName: 'API Slug', required: false }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		is_required: attioAi.optionalBooleanProp({ displayName: 'Required', description: 'Leave empty to keep the current setting.' }),
		is_unique: attioAi.optionalBooleanProp({ displayName: 'Unique', description: 'Leave empty to keep the current setting.' }),
		is_archived: attioAi.optionalBooleanProp({ displayName: 'Archived', description: 'Yes archives the attribute; No restores it.' }),
		config: Property.Json({ displayName: 'Config', description: 'Type-specific config to change.', required: false }),
	},
	async run(context) {
		const { target, identifier, attribute, title, api_slug, description, is_required, is_unique, is_archived, config } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.PATCH,
			resourceUri: `/${target}/${identifier}/attributes/${attribute}`,
			body: {
				data: attioAi.compact({
					title,
					api_slug,
					description,
					is_required: attioAi.toBoolean(is_required),
					is_unique: attioAi.toBoolean(is_unique),
					is_archived: attioAi.toBoolean(is_archived),
					config,
				}),
			},
		});
		return response.data;
	},
});
