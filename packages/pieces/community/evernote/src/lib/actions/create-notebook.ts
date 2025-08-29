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
      description: 'Whether this should be the default notebook (default: false)',
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
    const { apiKey, accessToken, noteStoreUrl } = auth as { 
      apiKey: string; 
      accessToken: string; 
      noteStoreUrl: string; 
    };
    
    if (!propsValue.name || propsValue.name.trim() === '') {
      throw new Error('Notebook name cannot be empty');
    }

    // Prepare the notebook object according to Evernote's API structure
    const notebookData: any = {
      name: propsValue.name,
      active: propsValue.active !== undefined ? propsValue.active : true,
      updateSequenceNum: 0,
    };

    if (propsValue.stack) {
      notebookData.stack = propsValue.stack;
    }

    if (propsValue.defaultNotebook) {
      notebookData.defaultNotebook = propsValue.defaultNotebook;
    }

    if (propsValue.publishingUri || propsValue.publicDescription) {
      notebookData.publishing = {};
      
      if (propsValue.publishingUri) {
        notebookData.publishing.uri = propsValue.publishingUri;
      }
      
      if (propsValue.publicDescription) {
        notebookData.publishing.description = propsValue.publicDescription;
      }
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: noteStoreUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `OAuth oauth_consumer_key="${apiKey}", oauth_token="${accessToken}"`,
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
