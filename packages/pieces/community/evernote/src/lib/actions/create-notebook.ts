import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { evernoteAuth } from '../../index';

export const createNotebook = createAction({
  auth: evernoteAuth,
  name: 'create-notebook',
  displayName: 'Create Notebook',
  description: 'Create a new notebook in Evernote',
  props: {
    name: Property.ShortText({
      displayName: 'Notebook Name',
      description: 'The name of the notebook to create',
      required: true,
    }),
    stack: Property.ShortText({
      displayName: 'Stack',
      description: 'The stack name to organize notebooks (optional)',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      description: 'Whether the notebook should be active (default: true)',
      required: false,
      defaultValue: true,
    }),
    defaultNotebook: Property.Checkbox({
      displayName: 'Default Notebook',
      description: 'Whether this should be the default notebook (optional)',
      required: false,
      defaultValue: false,
    }),
    publishingUri: Property.ShortText({
      displayName: 'Publishing URI',
      description: 'The URI for publishing the notebook (optional)',
      required: false,
    }),
    publicDescription: Property.LongText({
      displayName: 'Public Description',
      description: 'Public description for the published notebook (optional)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { access_token } = auth as { access_token: string };
    
    // Prepare the notebook object according to Evernote's API structure
    const notebookData: any = {
      name: propsValue.name,
      guid: '', // Will be assigned by the server
      updateSequenceNum: 0,
      active: propsValue.active !== undefined ? propsValue.active : true,
    };

    if (propsValue.stack) {
      notebookData.stack = propsValue.stack;
    }

    if (propsValue.defaultNotebook) {
      notebookData.defaultNotebook = propsValue.defaultNotebook;
    }

    // Handle publishing properties if provided
    if (propsValue.publishingUri || propsValue.publicDescription) {
      notebookData.publishing = {};
      
      if (propsValue.publishingUri) {
        notebookData.publishing.uri = propsValue.publishingUri;
      }
      
      if (propsValue.publicDescription) {
        notebookData.publishing.publicDescription = propsValue.publicDescription;
      }
    }

    try {
      // Evernote uses a custom API structure for creating notebooks
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://www.evernote.com/shard/s1/notestore',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
          'User-Agent': 'ActivePieces-Evernote-Integration/1.0',
        },
        body: JSON.stringify({
          method: 'createNotebook',
          params: [notebookData],
        }),
      });

      if (response.status === 200) {
        return {
          success: true,
          notebook: response.body,
          message: 'Notebook created successfully',
        };
      } else {
        throw new Error(`Failed to create notebook: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Error creating notebook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
