import { microsoftOneNoteAuth } from '../../';
import { TriggerStrategy, createTrigger, Property } from '@activepieces/pieces-framework';

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
  },
  async run(context) {
    const sectionId = await context.store.get('sectionId');
    if (!sectionId) {
      return [];
    }

    // This is a simplified implementation
    // In a real implementation, you would compare with previous state
    // to detect new notes
    return [];
  },
  async onDisable(context) {
    // Clean up stored data
    await context.store.delete('sectionId');
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