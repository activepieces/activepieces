import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { oneNoteAuth } from '../auth';
import { Client } from '@microsoft/microsoft-graph-client';

export const createNotebook = createAction({
	auth: oneNoteAuth,
	name: 'create_notebook',
	displayName: 'Create Notebook',
	description: 'Creates a notebook.',
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

		const authValue = auth as OAuth2PropertyValue;
		const cloud = authValue.props?.['cloud'] as string | undefined;
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(authValue.access_token),
			},
			baseUrl: getGraphBaseUrl(cloud),
		});

		const notebookBody = {
			displayName,
		};

		try {
			const response = await client.api('/me/onenote/notebooks').post(notebookBody);

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
		} catch (error: any) {
			throw new Error(`Failed to create notebook: ${error.message || 'Unknown error'}`);
		}
	},
});
