import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { wealthboxAuth } from '../common/auth';
import { WealthboxClient } from '../common/client';

export const createEvent = createAction({
  name: 'create_event',
  displayName: 'Create Event',
  description: 'Creates a new event in Wealthbox CRM',
  auth: wealthboxAuth,
  props: {
    title: Property.ShortText({
      displayName: 'Event Title',
      description: 'The title of the event',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the event',
      required: false,
    }),
    start_date: Property.DateTime({
      displayName: 'Start Date',
      description: 'The start date and time of the event',
      required: true,
    }),
    end_date: Property.DateTime({
      displayName: 'End Date',
      description: 'The end date and time of the event',
      required: false,
    }),
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to link the event to',
      required: false,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: 'The location of the event',
      required: false,
    }),
  },
  async run(context) {
    const client = new WealthboxClient(context.auth as OAuth2PropertyValue);
    
    const eventData: any = {
      title: context.propsValue.title,
      start_date: context.propsValue.start_date,
    };

    if (context.propsValue.description) {
      eventData.description = context.propsValue.description;
    }

    if (context.propsValue.end_date) {
      eventData.end_date = context.propsValue.end_date;
    }

    if (context.propsValue.contact_id) {
      eventData.contact_id = context.propsValue.contact_id;
    }

    if (context.propsValue.location) {
      eventData.location = context.propsValue.location;
    }

    const event = await client.createEvent(eventData);
    return event;
  },
}); 