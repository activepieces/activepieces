import { Property, createAction } from '@activepieces/pieces-framework';
import { microsoftOneNoteAuth } from '../auth';
import { microsoftOneNoteClient } from '../common/client';
import type { Notebook } from '../common/types';
import { createNotebookOutputSchema } from '../output-schemas';

export const createNotebookAction = createAction({
	auth: microsoftOneNoteAuth,
	name: 'create_notebook',
	outputSchema: createNotebookOutputSchema,
	classification: 'WRITE',
	displayName: 'Create Notebook',
	description: 'Creates a notebook.',
	audience: 'human',
	aiMetadata: { description: 'Creates a new OneNote notebook for the authenticated user, given a display name. Use as the top-level container before adding sections and pages; the name must be unique, under 128 characters, and avoid characters such as ?*/:<>|\'"%~. Not idempotent: each call attempts to create another notebook.', idempotent: false },
	props: {
		displayName: Property.ShortText({
			displayName: 'Notebook Name',
			description: 'The name of the notebook. Must be unique and cannot contain more than 128 characters or the following characters: ?*/:<>|\'"%~',
			required: true,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		const { displayName } = propsValue;

		const client = microsoftOneNoteClient.create({ auth });

		const notebookBody = {
			displayName,
		};

		try {
			const response: Notebook = await client.api('/me/onenote/notebooks').post(notebookBody);

			return {
				id: response.id,
				displayName: response.displayName,
				userRole: response.userRole,
				isShared: response.isShared,
				isDefault: response.isDefault,
				createdDateTime: response.createdDateTime,
				lastModifiedDateTime: response.lastModifiedDateTime,
				createdBy: response.createdBy,
				lastModifiedBy: response.lastModifiedBy,
				sectionsUrl: response.sectionsUrl,
				sectionGroupsUrl: response.sectionGroupsUrl,
				links: response.links,
				self: response.self,
			};
		} catch (error) {
			throw new Error(`Failed to create notebook: ${(error instanceof Error && error.message) || 'Unknown error'}`);
		}
	},
});
