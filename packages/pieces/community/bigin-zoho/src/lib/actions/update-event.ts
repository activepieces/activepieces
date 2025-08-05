import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest, BiginEvent } from '../common';

export const updateEvent = createAction({
  auth: biginZohoAuth,
  name: 'bigin_update_event',
  displayName: 'Update Event',
  description: 'Modify an existing event in Bigin',
  props: {
    eventId: Property.ShortText({
      displayName: 'Event ID',
      description: 'The ID of the event to update',
      required: true,
    }),
    eventTitle: Property.ShortText({
      displayName: 'Event Title',
      description: 'Title of the event',
      required: false,
    }),
    startDateTime: Property.ShortText({
      displayName: 'Start Date Time',
      description: 'Start date and time (YYYY-MM-DD HH:MM:SS format)',
      required: false,
    }),
    endDateTime: Property.ShortText({
      displayName: 'End Date Time',
      description: 'End date and time (YYYY-MM-DD HH:MM:SS format)',
      required: false,
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
      eventId,
      eventTitle,
      startDateTime,
      endDateTime,
      location,
      relatedTo,
      relatedContact,
      description,
    } = context.propsValue;

    const eventData: Partial<BiginEvent> = {};

    // Add only provided fields for partial update
    if (eventTitle) eventData.Event_Title = eventTitle;
    if (startDateTime) eventData.Start_DateTime = startDateTime;
    if (endDateTime) eventData.End_DateTime = endDateTime;
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
      HttpMethod.PUT,
      `/Events/${eventId}`,
      requestBody
    );

    return response;
  },
}); 