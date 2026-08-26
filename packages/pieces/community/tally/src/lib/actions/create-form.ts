import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { createFormOutputSchema } from '../output-schemas';

export const createForm = createAction({
	auth: tallyAuth,
	name: 'create_form',
	displayName: 'Create Form',
	description: 'Creates a new Tally form, optionally from a template.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a new form in a workspace, optionally initialised from a template. Returns the created form object with its new id. Each call creates a new form even for identical inputs, so retries duplicate — pair with List Forms to check for an existing name first if idempotency matters. Requires the destination workspace id (see List Workspaces or Get Current User).',
		idempotent: false,
	},
	outputSchema: createFormOutputSchema,
	props: {
		workspace_id: Property.ShortText({
			displayName: 'Workspace ID',
			description: 'The id of the workspace to create the form in. Obtain from List Workspaces.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Form Name',
			description: 'Display name for the new form.',
			required: true,
		}),
		template_id: Property.ShortText({
			displayName: 'Template ID',
			description: 'Optional template id to seed the form from.',
			required: false,
		}),
		blocks: Property.Json({
			displayName: 'Blocks',
			description: 'Initial blocks (form questions) array. Pass [] to create an empty form and add blocks later via Update Form.',
			required: false,
			defaultValue: [],
		}),
		status: Property.StaticDropdown({
			displayName: 'Initial Status',
			description: 'Status for the newly created form.',
			required: true,
			defaultValue: 'DRAFT',
			options: {
				options: [
					{ label: 'Draft', value: 'DRAFT' },
					{ label: 'Published', value: 'PUBLISHED' },
				],
			},
		}),
	},
	async run(context) {
		const body: Record<string, unknown> = {
			workspaceId: context.propsValue.workspace_id,
			name: context.propsValue.name,
			status: context.propsValue.status,
			blocks: context.propsValue.blocks ?? [],
		};
		if (context.propsValue.template_id) body['templateId'] = context.propsValue.template_id;
		return tallyApiClient.request<Record<string, unknown>>({
			method: HttpMethod.POST,
			path: '/forms',
			apiKey: context.auth.secret_text,
			body,
		});
	},
});
