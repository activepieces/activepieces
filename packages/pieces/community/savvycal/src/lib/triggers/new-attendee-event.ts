import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall, verifyWebhookSignature, buildTeamOptions, buildLinkOptions } from '../common';
import { savvyCalAuth } from '../../';

const ATTENDEE_EVENT_TYPES = [
  { label: 'Attendee Added', value: 'event.attendee.added' },
  { label: 'Attendee Canceled', value: 'event.attendee.canceled' },
  { label: 'Attendee Rescheduled', value: 'event.attendee.rescheduled' },
];

export const newAttendeeEventTrigger = createTrigger({
  auth: savvyCalAuth,
  name: 'new_attendee_event',
  displayName: 'New Attendee Event',
  description: 'Triggers when an attendee-related event occurs in SavvyCal (added, canceled, or rescheduled).',
  props: {
    event_types: Property.StaticMultiSelectDropdown({
      displayName: 'Attendee Event Types',
      description: 'Select which attendee event types to trigger on. Leave empty to trigger on all attendee types.',
      required: false,
      options: { options: ATTENDEE_EVENT_TYPES },
    }),
    team_id: Property.Dropdown({
      auth: savvyCalAuth,
      displayName: 'Team',
      description: 'Filter scheduling links by team. Leave empty to show all teams.',
      refreshers: [],
      required: false,
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
        try {
          const options = await buildTeamOptions(auth.secret_text);
          return { disabled: false, options };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load teams.' };
        }
      },
    }),
    link_ids: Property.MultiSelectDropdown({
      auth: savvyCalAuth,
      displayName: 'Scheduling Links',
      description: 'Only trigger for events on the selected scheduling links. Leave empty to trigger for all links.',
      refreshers: ['team_id'],
      required: false,
      options: async ({ auth, team_id }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
        try {
          const options = await buildLinkOptions(auth.secret_text, team_id as string | null);
          return { disabled: false, options };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load scheduling links.' };
        }
      },
    }),
  },
  sampleData: {
    event_type: 'event.attendee.added',
    id: 'att_abc123',
    display_name: 'Jane Doe',
    email: 'jane@example.com',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const response = await savvyCalApiCall<{ id: string; secret: string }>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/webhooks',
      body: { url: context.webhookUrl },
    });
    await context.store.put('webhookId', response.body.id);
    await context.store.put('webhookSecret', response.body.secret);
  },

  async onDisable(context) {
    const webhookId = await context.store.get<string>('webhookId');
    if (webhookId) {
      await savvyCalApiCall({
        token: context.auth.secret_text,
        method: HttpMethod.DELETE,
        path: `/webhooks/${webhookId}`,
      });
    }
  },

  async run(context) {
    const secret = await context.store.get<string>('webhookSecret');
    const signature = context.payload.headers['x-savvycal-signature'] as string | undefined;
    if (secret && (!signature || !verifyWebhookSignature(secret, signature, context.payload.rawBody))) {
      return [];
    }

    const body = context.payload.body as { type: string; payload: Record<string, unknown> & { link?: { id: string } } };
    if (!body?.payload) return [];

    if (!ATTENDEE_EVENT_TYPES.some((t) => t.value === body.type)) return [];

    const selectedTypes = context.propsValue.event_types as string[] | undefined;
    if (selectedTypes && selectedTypes.length > 0 && !selectedTypes.includes(body.type)) return [];

    const selectedLinkIds = context.propsValue.link_ids as string[] | undefined;
    const linkId = body.payload?.link?.id;
    if (selectedLinkIds && selectedLinkIds.length > 0 && linkId !== undefined && !selectedLinkIds.includes(linkId)) return [];

    return [{ event_type: body.type, ...body.payload }];
  },

  async test(_context) {
    return [];
  },
});
