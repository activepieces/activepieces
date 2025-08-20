
import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { evernoteAuth } from '../../index';

interface EvernoteNote {
  guid: string;
  title: string;
  content: string;
  contentLength: number;
  created: number;
  updated: number;
  active: boolean;
  notebookGuid: string;
  tagNames: string[];
  tagGuids: string[];
  updateSequenceNum: number;
}

interface EvernoteFindNotesResponse {
  notes: EvernoteNote[];
  totalNotes: number;
  startIndex: number;
  maxNotes: number;
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
      
      // Call Evernote's findNotes API to search for notes created after the last fetch
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: noteStoreUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `OAuth oauth_consumer_key="${apiKey}", oauth_token="${accessToken}"`,
          'User-Agent': 'ActivePieces-Evernote-Integration/1.0',
        },
        body: JSON.stringify({
          method: 'findNotes',
          params: [
            {
              words: 'created:*', // Search for all notes
              order: 1, // Sort by creation date (newest first)
              ascending: false,
              includeMimeTypes: ['text/html', 'text/plain'],
              inactive: false,
            },
            0, // startIndex
            50, // maxNotes - limit to 50 notes per poll
          ],
        }),
      });

      if (response.status === 200) {
        const result = response.body as EvernoteFindNotesResponse;
        const notes = result.notes || [];
        
        // Filter notes created after the last fetch time
        const newNotes = notes.filter(note => note.created > lastFetchTime);
        
        return newNotes.map((note) => ({
          epochMilliSeconds: note.created * 1000, // Convert to milliseconds
          data: {
            guid: note.guid,
            title: note.title,
            content: note.content,
            contentLength: note.contentLength,
            created: new Date(note.created * 1000).toISOString(),
            updated: new Date(note.updated * 1000).toISOString(),
            active: note.active,
            notebookGuid: note.notebookGuid,
            tagNames: note.tagNames,
            tagGuids: note.tagGuids,
            updateSequenceNum: note.updateSequenceNum,
            // Extract plain text content for easier processing
            plainText: note.content ? note.content.replace(/<[^>]*>/g, '').trim() : '',
            // Check if note has attachments
            hasAttachments: note.content ? note.content.includes('<en-media') : false,
          },
        }));
      } else {
        throw new Error(`Failed to fetch notes: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching Evernote notes:', error);
      throw new Error(`Error fetching notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};

export const newNote = createTrigger({
  auth: evernoteAuth,
  name: 'new-note',
  displayName: 'New Note',
  description: 'Triggers when a new note is created in Evernote. Automatically turns new notes into tasks or tickets.',
  props: {},
  sampleData: {
    guid: '12345678-1234-1234-1234-123456789012',
    title: 'Sample Note Title',
    content: '<en-note><div>This is a sample note content</div></en-note>',
    contentLength: 45,
    created: '2024-01-01T00:00:00.000Z',
    updated: '2024-01-01T00:00:00.000Z',
    active: true,
    notebookGuid: '87654321-4321-4321-4321-210987654321',
    tagNames: ['work', 'important'],
    tagGuids: ['tag1-1234-1234-1234-123456789012', 'tag2-5678-5678-5678-567856785678'],
    updateSequenceNum: 12345,
    plainText: 'This is a sample note content',
    hasAttachments: false,
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