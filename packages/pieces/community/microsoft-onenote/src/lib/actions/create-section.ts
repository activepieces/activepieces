import { Property, createAction } from '@activepieces/pieces-framework';
import { microsoftOneNoteAuth } from '../auth';
import { microsoftOneNoteClient } from '../common/client';
import { microsoftOneNoteProps } from '../common/props';
import type { OnenoteSection } from '../common/types';
import { createSectionOutputSchema } from '../output-schemas';

export const createSectionAction = createAction({
	auth: microsoftOneNoteAuth,
	name: 'create_section',
	outputSchema: createSectionOutputSchema,
	classification: 'WRITE',
	displayName: 'Create Section',
	description: 'Creates a new section in notebook.',
	audience: 'human',
	aiMetadata: { description: 'Creates a new section inside a chosen OneNote notebook, given a display name. Use to organize a notebook before adding pages; the name must be unique within the notebook, under 50 characters, and avoid characters such as ?*/:<>|&#\'%~. Not idempotent: each call attempts to create another section.', idempotent: false },
	props: {
		notebook_id: microsoftOneNoteProps.notebookId({
			required: true,
			description: 'The notebook to create the section in.',
		}),
		displayName: Property.ShortText({
			displayName: 'Section Name',
			description: 'The name of the section. Must be unique within the notebook and cannot contain more than 50 characters or the following characters: ?*/:<>|&#\'\'%~',
			required: true,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		const { notebook_id, displayName } = propsValue;

		const client = microsoftOneNoteClient.create({ auth });

		const sectionBody = {
			displayName,
		};

		try {
			const response: OnenoteSection = await client.api(`/me/onenote/notebooks/${notebook_id}/sections`).post(sectionBody);

			return {
				id: response.id,
				displayName: response.displayName,
				isDefault: response.isDefault,
				pagesUrl: response.pagesUrl,
				createdDateTime: response.createdDateTime,
				lastModifiedDateTime: response.lastModifiedDateTime,
				createdBy: response.createdBy,
				lastModifiedBy: response.lastModifiedBy,
				links: response.links,
				self: response.self,
			};
		} catch (error) {
			throw new Error(`Failed to create section: ${(error instanceof Error && error.message) || 'Unknown error'}`);
		}
	},
});
