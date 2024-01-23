import {
  createSessionsUsWebhookTrigger,
  SessionsUsWebhookTrigger,
} from '../common';

export const sessionStarted = createSessionsUsWebhookTrigger({
  name: 'session_started',
  displayName: 'Session Started',
  description: 'Triggered when a session starts.',
  trigger: SessionsUsWebhookTrigger.SESSION_STARTED,
  storeKey: 'sessions_session_started_trigger',
  sampleData: {
    session: {
      id: '5645d810-4e29-4c2c-b9a5-84d71a6429dd',
      name: 'My Talking Session',
      description: '',
      quickSession: false,
      room: null,
      createdAt: '2023-11-30T10:30:16.535Z',
      startAt: '2023-11-30T10:31:00.000Z',
      actualStart: null,
      endedAt: null,
      booking: null,
      event: null,
      participants: [
        {
          id: '0f2aced6-e099-424b-9448-4dd94d9ba3a0',
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
