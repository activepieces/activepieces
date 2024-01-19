import {
  createSessionsUsWebhookTrigger,
  SessionsUsWebhookTrigger,
} from '../common';

export const eventEnded = createSessionsUsWebhookTrigger({
  name: 'event_ended',
  displayName: 'Event Ended',
  description: 'Triggered when an event ends.',
  trigger: SessionsUsWebhookTrigger.EVENT_ENDED,
  storeKey: 'sessions_event_ended_trigger',
  sampleData: {
    session: {
      id: '8208f783-fba9-4045-ae6e-dea64f5ab7ea',
      name: 'My Best Event',
      description: null,
      quickSession: false,
      room: null,
      createdAt: '2023-11-30T10:46:13.675Z',
      startAt: '2023-11-30T11:00:00.000Z',
      actualStart: null,
      endedAt: null,
      booking: null,
      event: {
        id: '52259a5f-f706-41d9-8b58-1b8796bd0ffc',
        slug: 'f34bd8a5-a7d9-47f2-aee9-031d10a76b75-83897/my-best-event',
      },
      participants: [
        {
          id: 'd98f984f-982b-4a17-8a3d-093a4a774b49',
          isOwner: true,
          guest: null,
          user: {
            id: '9090bd7c-0cf9-4716-837e-43f3821a65c4',
            email: 'email@example.com',
            lastName: 'Pieces',
            firstName: 'Active',
          },
        },
      ],
    },
  },
});
