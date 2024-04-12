import { EventTrigger } from '../common';
import { registerWebhooks } from './register-webhook';

export const triggers = [
  {
    type: EventTrigger.BOOKING_CANCELLED,
    displayName: 'Booking Cancelled',
    sampleData: {
      triggerEvent: 'BOOKING_CANCELLED',
      createdAt: '2023-02-18T12:11:37.975Z',
      payload: {
        title: '30 Min Meeting between Mohammad Abu Aboud and John Doe',
        type: '30 Min Meeting',
        description: 'Discuss pricing',
        customInputs: {},
        startTime: '2023-02-21T11:00:00+00:00',
        endTime: '2023-02-21T11:30:00+00:00',
        organizer: {
          email: 'mo@activepieces.com',
          name: 'Mohammad Abu Aboud',
          timeZone: 'Europe/Berlin',
          language: {
            locale: 'en',
          },
        },
        attendees: [
          {
            name: 'John Doe',
            email: 'john@example.com',
            timeZone: 'Europe/Berlin',
            language: {
              locale: 'en',
            },
          },
        ],
        uid: '88wXJjC8AHAbepGYM2bwp4',
        location: 'integrations:daily',
        destinationCalendar: null,
        cancellationReason: 'Cancellation note',
        eventTitle: '30 Min Meeting',
        eventDescription: null,
        requiresConfirmation: null,
        price: null,
        currency: 'usd',
        length: 30,
        status: 'CANCELLED',
      },
    },
  },
  {
    type: EventTrigger.BOOKING_CREATED,
    displayName: 'Booking Created',
    sampleData: {
      triggerEvent: 'BOOKING_CREATED',
      createdAt: '2023-02-18T11:54:18.440Z',
      payload: {
        type: '15 Min Meeting',
        title: '15 Min Meeting between Ash Sam and John Doe',
        description: '',
        additionalNotes: '',
        customInputs: {},
        startTime: '2023-02-20T08:00:00Z',
        endTime: '2023-02-20T08:15:00Z',
        organizer: {
          id: 63498,
          name: 'Ash Sam',
          email: 'ash@sam.com',
          timeZone: 'Europe/Berlin',
          language: {
            locale: 'en',
          },
        },
        attendees: [
          {
            email: 'johndoe@gmail.com',
            name: 'John Doe',
            timeZone: 'Europe/Berlin',
            language: {
              locale: 'en',
            },
          },
        ],
        location: 'integrations:daily',
        destinationCalendar: null,
        hideCalendarNotes: false,
        requiresConfirmation: null,
        eventTypeId: 217779,
        seatsShowAttendees: false,
        seatsPerTimeSlot: null,
        uid: 'pssX2hWwDbuKHmdGQ9BuBz',
        conferenceData: {
          createRequest: {
            requestId: '2db644eb-37a5-581a-99fa-ebe6ce513834',
          },
        },
        videoCallData: {
          type: 'daily_video',
          id: 'GrhVEmlnsyhAGw3UWKjW',
          password:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyIjoir3JoVkVtbG5zeWhBR3czVVdLalciLCJvIjf0cnVlLCJkIjoiYmJkOThhNzEtMTljOS00YmIxLWE1YzUtY2FmMWVjNWJkMTA1IiwiaWF0IjoxNjc2NzIxMjU4fQ.FbmuGSRgCae6yfQKSldHEpUwHfLOZXS_m72rjnFu6gc',
          url: 'https://meetco.daily.co/GrhVEmlnsyhAGw3UWKjW',
        },
        appsStatus: [
          {
            appName: 'Cal Video',
            type: 'daily_video',
            success: 1,
            failures: 0,
            errors: [],
          },
        ],
        eventTitle: '15 Min Meeting',
        eventDescription: null,
        price: 0,
        currency: 'usd',
        length: 15,
        bookingId: 235143,
        metadata: {
          videoCallUrl: 'https://meetco.daily.co/GrhVEmlnsyhAGw3UWKjW',
        },
        status: 'ACCEPTED',
      },
    },
  },
  {
    type: EventTrigger.BOOKING_RESCHEDULED,
    displayName: 'Booking Rescheduled',
    sampleData: {
      triggerEvent: 'BOOKING_RESCHEDULED',
      createdAt: '2023-02-18T12:11:26.909Z',
      payload: {
        type: '30 Min Meeting',
        title: '30 Min Meeting between Mohammad Abu Aboud and John Doe',
        description: 'Discuss pricing',
        additionalNotes: 'Discuss pricing',
        customInputs: {},
        startTime: '2023-02-21T11:00:00Z',
        endTime: '2023-02-21T11:30:00Z',
        organizer: {
          id: 63498,
          name: 'Mohammad Abu Aboud',
          email: 'mo@example.com',
          timeZone: 'Europe/Berlin',
          language: {
            locale: 'en',
          },
        },
        attendees: [
          {
            email: 'john@example.com',
            name: 'John Doe',
            timeZone: 'Europe/Berlin',
            language: {
              locale: 'en',
            },
          },
        ],
        location: 'https://meetco.daily.co/9tJRDCRw9ESmb64SuEwU',
        destinationCalendar: null,
        hideCalendarNotes: false,
        requiresConfirmation: null,
        eventTypeId: 217780,
        seatsShowAttendees: false,
        seatsPerTimeSlot: null,
        uid: '88wXJjC8AHAbepGYM2bwp4',
        conferenceData: {
          createRequest: {
            requestId: '2db644eb-37a5-581a-99fa-ebe6ce513834',
          },
        },
        videoCallData: {
          type: 'daily_video',
          id: '9tJRDCRw9ESmb64SuEwU',
          password: 'PASSWORD',
          url: 'https://meetco.daily.co/RANDOM',
        },
        eventTitle: '30 Min Meeting',
        eventDescription: null,
        price: 0,
        currency: 'usd',
        length: 30,
        bookingId: 235153,
        rescheduleUid: '3qTJ7WiwdMR3RJmDW2KGhr',
        rescheduleStartTime: '2023-02-20T08:30:00Z',
        rescheduleEndTime: '2023-02-20T09:00:00Z',
        metadata: {},
        status: 'ACCEPTED',
      },
    },
  },
].map((eventTrigger) =>
  registerWebhooks({
    name: eventTrigger.type,
    displayName: eventTrigger.displayName,
    sampleData: eventTrigger.sampleData,
    description: `Create a webhook to monitor when ${eventTrigger.displayName}`,
  })
);
