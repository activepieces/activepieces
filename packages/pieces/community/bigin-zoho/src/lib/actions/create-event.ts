import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest, BiginEvent } from '../common';

export const createEvent = createAction({
  auth: biginZohoAuth,
  name: 'bigin_create_event',
  displayName: 'Create Event',
  description: 'Schedule or log an event in Bigin',
  props: {
    eventTitle: Property.ShortText({
      displayName: 'Event Title',
      description: 'Title of the event',
      required: true,
    }),
    startDateTime: Property.ShortText({
      displayName: 'Start Date Time',
      description: 'Start date and time (YYYY-MM-DD HH:MM:SS format)',
      required: true,
    }),
    endDateTime: Property.ShortText({
      displayName: 'End Date Time',
      description: 'End date and time (YYYY-MM-DD HH:MM:SS format)',
      required: true,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: 'Event location',
      required: false,
    }),
    relatedTo: Property.ShortText({
      displayName: 'Related To (What ID)',
      description: 'ID of the related record (Account, Deal, etc.)',
      required: false,
    }),
    relatedContact: Property.ShortText({
      displayName: 'Related Contact (Who ID)',
      description: 'ID of the related contact',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Event description and agenda',
      required: false,
    }),
  },
  async run(context) {
    const {
      eventTitle,
      startDateTime,
      endDateTime,
      location,
      relatedTo,
      relatedContact,
      description,
    } = context.propsValue;

    const eventData: Partial<BiginEvent> = {
      Event_Title: eventTitle,
      Start_DateTime: startDateTime,
      End_DateTime: endDateTime,
    };

    // Add optional fields if provided
    if (location) eventData.Location = location;
    if (relatedTo) {
      eventData.What_Id = { id: relatedTo };
    }
    if (relatedContact) {
      eventData.Who_Id = { id: relatedContact };
    }
    if (description) eventData.Description = description;

    const requestBody = {
      data: [eventData],
    };

    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      '/Events',
      requestBody
    );

    return response;
  },
}); 