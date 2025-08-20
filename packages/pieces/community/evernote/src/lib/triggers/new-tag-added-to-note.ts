
import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { evernoteAuth } from '../../index';

interface EvernoteNote {
  guid: string;
  title: string;
  tagNames: string[];
  tagGuids: string[];
  updated: number;
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
    const { access_token } = auth as { access_token: string };
    
    try {
      // Convert lastFetchEpochMS to Evernote timestamp (seconds since epoch)
      const lastFetchTime = lastFetchEpochMS ? Math.floor(lastFetchEpochMS / 1000) : 0;
      
      // Call Evernote's findNotes API to search for notes with tags
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://www.evernote.com/shard/s1/notestore',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
          'User-Agent': 'ActivePieces-Evernote-Integration/1.0',
        },
        body: JSON.stringify({
          method: 'findNotes',
          params: [
            {
              words: 'tag:*', // Search for notes with tags
              order: 2, // Sort by update date (most recently updated first)
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
        
        // Filter notes updated after the last fetch time and that have tags
        const notesWithTags = notes.filter(note => 
          note.updated > lastFetchTime && 
          note.tagNames && 
          note.tagNames.length > 0
        );
        
        return notesWithTags.map((note) => ({
          epochMilliSeconds: note.updated * 1000, // Convert to milliseconds
          data: {
            noteGuid: note.guid,
            title: note.title,
            tagNames: note.tagNames,
            tagGuids: note.tagGuids,
            updated: new Date(note.updated * 1000).toISOString(),
            // Extract the most recently added tag (assuming tags are added in order)
            latestTag: note.tagNames[note.tagNames.length - 1],
            latestTagGuid: note.tagGuids[note.tagGuids.length - 1],
            totalTags: note.tagNames.length,
          },
        }));
      } else {
        throw new Error(`Failed to fetch notes with tags: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching Evernote notes with tags:', error);
      throw new Error(`Error fetching notes with tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};

export const newTagAddedToNote = createTrigger({
  auth: evernoteAuth,
  name: 'new-tag-added-to-note',
  displayName: 'New Tag Added to Note',
  description: 'Triggers when a new tag is added to an existing note in Evernote.',
  props: {},
  sampleData: {
    noteGuid: '12345678-1234-1234-1234-123456789012',
    title: 'Sample Note with Tags',
    tagNames: ['work', 'important', 'new-tag'],
    tagGuids: ['tag1-1234-1234-1234-123456789012', 'tag2-5678-5678-5678-567856785678', 'tag3-9012-9012-9012-901290129012'],
    updated: '2024-01-01T00:00:00.000Z',
    latestTag: 'new-tag',
    latestTagGuid: 'tag3-9012-9012-9012-901290129012',
    totalTags: 3,
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