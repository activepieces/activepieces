import { createAction, Property } from '@activepieces/pieces-framework';

import { tallyAuth } from '../auth';
import { tallyApiClient } from '../common/client';
import { foldersDropdown, optionalWorkspacesDropdown } from '../common/props';
import { createFormActionOutputSchema } from '../output-schemas';

export const createFormAction = createAction({
	auth: tallyAuth,
	name: 'create_form',
	classification: 'WRITE',
	displayName: 'Create Form',
	description: 'Create a new form from a blocks definition',
	audience: 'ai',
	outputSchema: createFormActionOutputSchema,
	aiMetadata: {
		description:
			'Creates a new form from a raw Tally blocks array (the same structure the Tally editor produces/exports) and an initial status. Use Get Form on an existing form to see the exact block shape before authoring new blocks. Each call creates a new form, so it is not idempotent (retries duplicate).',
		idempotent: false,
	},
	props: {
		blocks: Property.Json({
			displayName: 'Blocks',
			description:
				'Array of Tally block objects that define the form content and fields (titles, inputs, choices, etc). Fetch an existing form with Get Form to see the exact shape blocks must take.',
			required: true,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'BLANK has no content yet; DRAFT is editable and not publicly accessible; PUBLISHED is live and accepting submissions.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Blank', value: 'BLANK' },
					{ label: 'Draft', value: 'DRAFT' },
					{ label: 'Published', value: 'PUBLISHED' },
				],
			},
		}),
		workspace_id: optionalWorkspacesDropdown,
		folder_id: foldersDropdown,
		template_id: Property.ShortText({
			displayName: 'Template ID',
			description: 'Optional Tally template ID to base the form on.',
			required: false,
		}),
		settings: Property.Json({
			displayName: 'Settings',
			description:
				'Optional form settings object (language, notifications, redirects, data retention, styling, password protection, etc).',
			required: false,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		return tallyApiClient.createForm({
			apiKey: auth.secret_text,
			blocks: propsValue.blocks,
			status: propsValue.status,
			workspaceId: propsValue.workspace_id,
			folderId: propsValue.folder_id,
			templateId: propsValue.template_id,
			settings: propsValue.settings,
		});
	},
});
