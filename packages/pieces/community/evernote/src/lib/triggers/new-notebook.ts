
import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { evernoteAuth } from '../../index';

interface EvernoteNotebook {
  guid: string;
  name: string;
  created: number;
  updated: number;
  stack: string;
  published: boolean;
  publishing: {
    uri: string;
    order: number;
    ascending: boolean;
    publicDescription: string;
  } | null;
  sharedNotebookIds: number[];
  businessNotebook: {
    id: string;
    name: string;
  } | null;
  contact: {
    id: string;
    name: string;
    type: string;
    photoUrl: string;
    photoLastUpdated: number;
  } | null;
  restrictions: {
    noReadNotes: boolean;
    noCreateNotes: boolean;
    noUpdateNotes: boolean;
    noExpungeNotes: boolean;
    noShareNotes: boolean;
    noEmailNotes: boolean;
    noSendMessageToRecipients: boolean;
    noUpdateNotebook: boolean;
    noExpungeNotebook: boolean;
    noSetDefaultNotebook: boolean;
    noSetReadOnly: boolean;
    noPublishing: boolean;
    noPublishToPublic: boolean;
    noPublishToBusinessLibrary: boolean;
    noCreateTags: boolean;
    noUpdateTags: boolean;
    noExpungeTags: boolean;
    noSetParentTag: boolean;
    noCreateSharedNotebooks: boolean;
    updateWhichSharedNotebookRestrictions: number;
    expungeWhichSharedNotebookRestrictions: number;
  } | null;
}

interface EvernoteListNotebooksResponse {
  notebooks: EvernoteNotebook[];
}

const polling: Polling<PiecePropValueSchema<typeof evernoteAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const { apiKey, accessToken, noteStoreUrl } = auth as { 
      apiKey: string; 
      accessToken: string; 
      noteStoreUrl: string; 
    };
    
    try {
      // Convert lastFetchEpochMS to Evernote timestamp (seconds since epoch)
      const lastFetchTime = lastFetchEpochMS ? Math.floor(lastFetchEpochMS / 1000) : 0;
      
      // Call Evernote's listNotebooks API to get all notebooks
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: noteStoreUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `OAuth oauth_consumer_key="${apiKey}", oauth_token="${accessToken}"`,
          'User-Agent': 'ActivePieces-Evernote-Integration/1.0',
        },
        body: JSON.stringify({
          method: 'listNotebooks',
          params: [],
        }),
      });

      if (response.status === 200) {
        const result = response.body as EvernoteListNotebooksResponse;
        const notebooks = result.notebooks || [];
        
        // Filter notebooks created after the last fetch time
        const newNotebooks = notebooks.filter(notebook => notebook.created > lastFetchTime);
        
        return newNotebooks.map((notebook) => ({
          epochMilliSeconds: notebook.created * 1000, // Convert to milliseconds
          data: {
            guid: notebook.guid,
            name: notebook.name,
            created: new Date(notebook.created * 1000).toISOString(),
            updated: new Date(notebook.updated * 1000).toISOString(),
            stack: notebook.stack || null,
            published: notebook.published,
            publishing: notebook.publishing,
            sharedNotebookIds: notebook.sharedNotebookIds || [],
            businessNotebook: notebook.businessNotebook,
            contact: notebook.contact,
            restrictions: notebook.restrictions,
            // Additional computed fields
            isShared: notebook.sharedNotebookIds && notebook.sharedNotebookIds.length > 0,
            isBusiness: !!notebook.businessNotebook,
            hasPublishing: !!notebook.publishing,
            hasRestrictions: !!notebook.restrictions,
          },
        }));
      } else {
        throw new Error(`Failed to fetch notebooks: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching Evernote notebooks:', error);
      throw new Error(`Error fetching notebooks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};

export const newNotebook = createTrigger({
  auth: evernoteAuth,
  name: 'new-notebook',
  displayName: 'New Notebook',
  description: 'Triggers when a new notebook is created in Evernote. Useful for organizing workflows by notebook creation.',
  props: {},
  sampleData: {
    guid: '87654321-4321-4321-4321-210987654321',
    name: 'Sample Notebook',
    created: '2024-01-01T00:00:00.000Z',
    updated: '2024-01-01T00:00:00.000Z',
    stack: 'Work',
    published: false,
    publishing: null,
    sharedNotebookIds: [],
    businessNotebook: null,
    contact: null,
    restrictions: null,
    isShared: false,
    isBusiness: false,
    hasPublishing: false,
    hasRestrictions: false,
  },
  type: TriggerStrategy.POLLING,
  
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});