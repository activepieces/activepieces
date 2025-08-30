import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { avomaAuth } from '../../index';
import { createAvomaClient } from '../common';

export const newNoteTrigger = createTrigger({
  auth: avomaAuth,
  name: 'new_note',
  displayName: 'New Note',
  description: 'Triggers when notes are successfully generated for meetings or calls',
  props: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    // Store initial state
    await context.store?.put('lastCheck', new Date().toISOString());
  },
  onDisable: async (context) => {
    await context.store?.delete('lastCheck');
  },
  run: async (context) => {
    const client = createAvomaClient(context.auth);
    const lastCheck = await context.store?.get('lastCheck') as string;
    
    try {
      const notes = await client.getNotes(lastCheck);
      const newNotes = notes.filter(note => 
        !lastCheck || new Date(note.created_at) > new Date(lastCheck)
      );

      if (newNotes.length > 0) {
        await context.store?.put('lastCheck', new Date().toISOString());
      }

      return newNotes.map(note => ({
        id: note.note_id,
        data: note,
      }));
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  },
  test: async (context) => {
    const client = createAvomaClient(context.auth);
    
    try {
      const notes = await client.getNotes();
      return notes.slice(0, 3).map(note => ({
        id: note.note_id,
        data: note,
      }));
    } catch (error) {
      return [];
    }
  },
});