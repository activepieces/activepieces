import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioCreateListOutputSchema } from '../../output-schemas';

export const attioUpdateListAction = createAction({
	auth: attioAuth,
	name: 'attio_update_list',
	outputSchema: attioCreateListOutputSchema,
	displayName: 'Update List',
	description: 'Updates the name, slug or access of a list.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Updates only the supplied fields of a list; omitted fields keep their current value.',
		idempotent: true,
	},
	props: {
		list: attioAi.listProp(),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		api_slug: Property.ShortText({ displayName: 'API Slug', required: false }),
		workspace_access: Property.StaticDropdown({
			displayName: 'Workspace Access',
			required: false,
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
		const { list, name, api_slug, workspace_access } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.PATCH,
			resourceUri: `/lists/${list}`,
			body: { data: attioAi.compact({ name, api_slug, workspace_access }) },
		});
		return response.data;
	},
});
