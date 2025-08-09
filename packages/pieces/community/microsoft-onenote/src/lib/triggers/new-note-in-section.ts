import { microsoftOneNoteAuth } from '../../';
import { TriggerStrategy, createTrigger, Property } from '@activepieces/pieces-framework';
import { MicrosoftOneNoteClient } from '../common';

export const newNoteInSectionTrigger = createTrigger({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_new_note_in_section',
  displayName: 'New Note in Section',
  description: 'Triggers when a new note is created in a specified section.',
  type: TriggerStrategy.POLLING,
  props: {
    sectionId: Property.ShortText({
      displayName: 'Section ID',
      description: 'The ID of the section to monitor for new notes',
      required: true,
    }),
  },
  async onEnable(context) {
    // Store the section ID for polling
    await context.store.put('sectionId', context.propsValue.sectionId);
    // Store the last check time
    await context.store.put('lastCheckTime', new Date().toISOString());
  },
  async run(context) {
    const sectionId = await context.store.get<string>('sectionId');
    const lastCheckTime = await context.store.get<string>('lastCheckTime');
    
    if (!sectionId) {
      return [];
    }

    const client = new MicrosoftOneNoteClient(context.auth.access_token);
    
    try {
      // Get pages from the section
      const pagesResponse = await client.listPages(sectionId);
      const currentTime = new Date().toISOString();
      
      // Filter pages modified after the last check
      const newPages = pagesResponse.value.filter(page => {
        if (!page.lastModifiedDateTime) return false;
        const pageModifiedTime = new Date(page.lastModifiedDateTime);
        const lastCheck = new Date(lastCheckTime || '');
        return pageModifiedTime > lastCheck;
      });

      // Update the last check time
      await context.store.put('lastCheckTime', currentTime);

      return newPages.map(page => ({
        id: page.id,
        title: page.title,
        contentUrl: page.contentUrl,
        lastModifiedDateTime: page.lastModifiedDateTime,
        createdByAppId: page.createdByAppId,
        links: page.links,
      }));
    } catch (error) {
      console.error('Error polling for new notes:', error);
      return [];
    }
  },
  async onDisable(context) {
    // Clean up stored data
    await context.store.delete('sectionId');
    await context.store.delete('lastCheckTime');
  },
  sampleData: {
    id: 'page-id-123',
    title: 'New Note',
    contentUrl: 'https://graph.microsoft.com/v1.0/me/onenote/pages/page-id-123/content',
    lastModifiedDateTime: '2024-01-01T12:00:00Z',
    createdByAppId: 'app-id',
    links: {
      oneNoteClientUrl: {
        href: 'onenote:///...',
      },
      oneNoteWebUrl: {
        href: 'https://www.onenote.com/notebook/...',
      },
    },
  },
}); 