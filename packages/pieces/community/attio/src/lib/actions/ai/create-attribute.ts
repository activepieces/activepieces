import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioGetAttributeOutputSchema } from '../../output-schemas';

export const attioCreateAttributeAction = createAction({
	auth: attioAuth,
	name: 'attio_create_attribute',
	outputSchema: attioGetAttributeOutputSchema,
	displayName: 'Create Attribute',
	description: 'Creates an attribute on an object or list.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Creates a new attribute (field) on an object or list. Attributes cannot be deleted through the API, only archived with Update Attribute. Record-reference and currency types need Config.',
		idempotent: false,
	},
	props: {
		target: attioAi.targetProp(),
		identifier: attioAi.identifierProp(),
		title: Property.ShortText({ displayName: 'Title', required: true }),
		api_slug: Property.ShortText({ displayName: 'API Slug', description: 'Unique snake_case slug.', required: true }),
		type: Property.ShortText({
			displayName: 'Type',
			description: 'One of `text`, `number`, `checkbox`, `currency`, `date`, `timestamp`, `rating`, `status`, `select`, `record-reference`, `actor-reference`, `location`, `domain`, `email-address`, `phone-number`.',
			required: true,
		}),
		description: Property.LongText({ displayName: 'Description', required: false }),
		is_required: Property.Checkbox({ displayName: 'Required', required: false }),
		is_unique: Property.Checkbox({ displayName: 'Unique', required: false }),
		is_multiselect: Property.Checkbox({ displayName: 'Multiselect', required: false }),
		config: Property.Json({
			displayName: 'Config',
			description: 'Type-specific config, e.g. {"currency": {"default_currency_code": "USD", "display_type": "symbol"}} or {"record_reference": {"allowed_objects": ["people"]}}.',
			required: false,
		}),
	},
	async run(context) {
		const { target, identifier, title, api_slug, type, description, is_required, is_unique, is_multiselect, config } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/${target}/${identifier}/attributes`,
			body: {
				data: {
					title,
					api_slug,
					type,
					description: description ?? null,
					is_required: is_required ?? false,
					is_unique: is_unique ?? false,
					is_multiselect: is_multiselect ?? false,
					config: config ?? {},
				},
			},
		});
		return response.data;
	},
});
