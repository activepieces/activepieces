import {
  createSessionsUsWebhookTrigger,
  SessionsUsWebhookTrigger,
} from '../common';

export const bookingEnded = createSessionsUsWebhookTrigger({
  name: 'booking_ended',
  displayName: 'Booking Ended',
  description: 'Triggered when a booking ends.',
  trigger: SessionsUsWebhookTrigger.BOOKING_ENDED,
  storeKey: 'sessions_booking_ended_trigger',
  sampleData: {
    session: {
      id: '2f8547a5-5c36-49ea-bc21-c61e337d89a3',
      name: 'Talk with Active Pieces',
      description: '',
      quickSession: false,
      room: null,
      createdAt: '2023-11-30T10:21:41.372Z',
      startAt: '2023-11-30T10:30:00.000Z',
      actualStart: '2023-11-30T10:34:37.799Z',
      endedAt: null,
      booking: {
        id: '3df6dbdb-9a6c-41e6-89b2-d7a38233163e',
        name: 'Talk with Active Pieces',
        participantName: 'Active Pieces',
        participantEmail: 'example@gmail.com',
        guests: [],
      },
      event: null,
      participants: [
        {
          id: '2021014e-5e28-498f-9fe3-3428ce40c9c4',
          isOwner: false,
          guest: {
            id: '529e6bc0-af38-4365-a0b2-5530d8207ecb',
            email: 'example@gmail.com',
            lastName: null,
            firstName: 'Active Pieces',
          },
          user: null,
        },
        {
          id: '529b967f-de3d-4dec-a865-35637c294f9c',
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
