import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getNotebooksDropdown } from '../common';
import { oneNoteAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';

export const createSection = createAction({
	auth: oneNoteAuth,
	name: 'create_section',
	displayName: 'Create Section',
	description: 'Creates a new section in notebook.',
	props: {
		notebook_id: Property.Dropdown({
			displayName: 'Notebook',
			description: 'The notebook to create the section in.',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!(auth as OAuth2PropertyValue)?.access_token) {
					return {
						disabled: true,
						placeholder: 'Connect your account first',
						options: [],
					};
				}
				return await getNotebooksDropdown(auth as OAuth2PropertyValue);
			},
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

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve((auth as OAuth2PropertyValue).access_token),
			},
		});

		const sectionBody = {
			displayName,
		};

		try {
			const response = await client.api(`/me/onenote/notebooks/${notebook_id}/sections`).post(sectionBody);

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
		} catch (error: any) {
			throw new Error(`Failed to create section: ${error.message || 'Unknown error'}`);
		}
	},
});
