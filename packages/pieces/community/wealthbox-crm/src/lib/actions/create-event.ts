import { Property, createAction } from '@activepieces/pieces-framework';
import { wealthboxCrmAuth } from '../../';
import { makeClient, wealthboxCommon } from '../common';

export const createEventAction = createAction({
  auth: wealthboxCrmAuth,
  name: 'create_event',
  displayName: 'Create Event',
  description: 'Creates a calendar event linked to contact',
  props: {
    subject: Property.ShortText({
      displayName: 'Event Subject',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    start_date: Property.DateTime({
      displayName: 'Start Date & Time',
      required: true,
    }),
    end_date: Property.DateTime({
      displayName: 'End Date & Time',
      required: true,
    }),
    contact_id: wealthboxCommon.contactId,
    location: Property.ShortText({
      displayName: 'Location',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
      items: Property.ShortText({
        displayName: 'Tag',
        required: true,
      }),
    }),
  },
  async run(context) {
    const { subject, description, start_date, end_date, contact_id, location, tags } = context.propsValue;
    
    const client = makeClient(context.auth);
    
    const eventData: any = {
      subject,
      start_date,
      end_date,
      contact_id,
    };

    if (description) eventData.description = description;
    if (location) eventData.location = location;
    if (tags && tags.length > 0) eventData.tags = tags;

    const result = await client.createEvent(eventData);
    
    return result;
  },
});
