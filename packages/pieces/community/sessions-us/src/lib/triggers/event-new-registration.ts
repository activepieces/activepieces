import {
  createSessionsUsWebhookTrigger,
  SessionsUsWebhookTrigger,
} from '../common';

export const eventNewRegistration = createSessionsUsWebhookTrigger({
  name: 'event_new_registration',
  displayName: 'Event New Registration',
  description: 'Triggered when a new registration for an event occurs.',
  trigger: SessionsUsWebhookTrigger.EVENT_NEW_REGISTRATION,
  storeKey: 'sessions_event_new_registration_trigger',
  sampleData: {
    eventId: '52259a5f-f706-41d9-8b58-1b8796bd0ffc',
    sessionId: '8208f783-fba9-4045-ae6e-dea64f5ab7ea',
    registeredParticipant: {
      id: '5164d6de-5f72-4990-8a42-8b5c9b7d5670',
      email: 'email@example.com',
      firstName: 'Active Pieces',
      form: [
        {
          question: 'Name',
          answer: 'Active Pieces',
        },
        {
          question: 'Email',
          answer: 'email@example.com',
        },
      ],
    },
  },
});
