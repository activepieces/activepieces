import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioCreateListOutputSchema } from '../../output-schemas';

export const attioCreateListAction = createAction({
	auth: attioAuth,
	name: 'attio_create_list',
	outputSchema: attioCreateListOutputSchema,
	displayName: 'Create List',
	description: 'Creates a new list for an object.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Creates a new list whose entries are records of the parent object. Lists cannot be deleted through the API. Workspace access other than Full access may need a paid plan; Full access works on every plan. Not idempotent.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		api_slug: Property.ShortText({ displayName: 'API Slug', description: 'Unique snake_case slug, e.g. `enterprise_pipeline`.', required: true }),
		parent_object: attioAi.objectProp(),
		workspace_access: Property.StaticDropdown({
			displayName: 'Workspace Access',
			description: 'Access level for all workspace members. Full access works on every plan.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Full access', value: 'full-access' },
					{ label: 'Read and write', value: 'read-and-write' },
					{ label: 'Read only', value: 'read-only' },
				],
			},
		}),
	},
	async run(context) {
		const { name, api_slug, parent_object, workspace_access } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/lists`,
			body: { data: { name, api_slug, parent_object, workspace_access, workspace_member_access: [] } },
		});
		return response.data;
	},
});
