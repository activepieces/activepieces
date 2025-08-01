import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeClient } from '../common/client';
import { CreateWebhookResponse } from '../common/types';

export const newNoteTrigger = createTrigger({
  auth: aircallAuth,
  name: 'new_note',
  displayName: 'New Note',
  description: 'Triggers when a new note is added to a call',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  onEnable: async (context) => {
    const client = makeClient({
      username: context.auth.username,
      password: context.auth.password,
      baseUrl: context.auth.baseUrl || 'https://api.aircall.io/v1',
    });

    const webhook = await client.createWebhook({
      url: context.webhookUrl,
      events: ['note.created'],
    });

    await context.store.put<CreateWebhookResponse>('aircall_new_note', webhook);
  },
  onDisable: async (context) => {
    const webhook = await context.store.get<CreateWebhookResponse>('aircall_new_note');
    if (webhook) {
      const client = makeClient({
        username: context.auth.username,
        password: context.auth.password,
        baseUrl: context.auth.baseUrl || 'https://api.aircall.io/v1',
      });
      await client.deleteWebhook(webhook.id);
    }
  },
  run: async (context) => {
    const payload = context.payload.body as { event: string; data: unknown };
    
    // Filter for note.created events
    if (payload.event === 'note.created') {
      return [payload.data];
    }
    
    return [];
  },
  sampleData: async ({ auth }: { auth: { username: string; password: string; baseUrl?: string } }) => {
    try {
      const client = makeClient({
        username: auth.username,
        password: auth.password,
        baseUrl: auth.baseUrl || 'https://api.aircall.io/v1',
      });

      // Fetch real calls from Aircall API
      const calls = await client.getCalls({ limit: 1 });
      
      if (calls && calls.length > 0) {
        const call = calls[0];
        // Fetch notes for this call
        const notes = await client.getNotes(call.id);
        
        if (notes && notes.length > 0) {
          const note = notes[0];
          return {
            event: 'note.created',
            data: {
              id: note.id,
              call_id: call.id,
              content: note.content,
              user_id: note.user_id,
              created_at: note.created_at,
            },
          };
        }
      }

      // Fallback to sample data if no notes found
      return {
        event: 'note.created',
        data: {
          id: 123,
          call_id: 456,
          content: 'Customer requested callback',
          user_id: 789,
          created_at: '2023-01-01T12:00:00Z',
        },
      };
    } catch (error) {
      console.error('Error fetching sample data:', error);
      // Return fallback sample data on error
      return {
        event: 'note.created',
        data: {
          id: 123,
          call_id: 456,
          content: 'Customer requested callback',
          user_id: 789,
          created_at: '2023-01-01T12:00:00Z',
        },
      };
    }
  },
}); 