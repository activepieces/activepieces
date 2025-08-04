import { zohoAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const updateEvent = createAction({
  auth: zohoAuth,
  name: 'update-event',
  displayName: 'Update Event',
  description: 'Modify an existing event in Bigin',
  props: {
    eventId: Property.ShortText({
      displayName: 'Event ID',
      description: 'ID of the event to update',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Subject or title of the event',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description or details of the event',
      required: false,
    }),
    startTime: Property.DateTime({
      displayName: 'Start Time',
      description: 'Start date and time of the event',
      required: false,
    }),
    endTime: Property.DateTime({
      displayName: 'End Time',
      description: 'End date and time of the event',
      required: false,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: 'Location of the event',
      required: false,
    }),
    eventType: Property.StaticDropdown({
      displayName: 'Event Type',
      description: 'Type of event',
      required: false,
      options: {
        options: [
          { label: 'Meeting', value: 'meeting' },
          { label: 'Call', value: 'call' },
          { label: 'Demo', value: 'demo' },
          { label: 'Presentation', value: 'presentation' },
          { label: 'Training', value: 'training' },
          { label: 'Conference', value: 'conference' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    isAllDay: Property.Checkbox({
      displayName: 'All Day Event',
      description: 'Check if this is an all-day event',
      required: false,
    }),
    reminder: Property.StaticDropdown({
      displayName: 'Reminder',
      description: 'Reminder time before the event',
      required: false,
      options: {
        options: [
          { label: 'No Reminder', value: 'none' },
          { label: '15 minutes before', value: '15' },
          { label: '30 minutes before', value: '30' },
          { label: '1 hour before', value: '60' },
          { label: '1 day before', value: '1440' },
        ],
      },
    }),
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'ID of the contact related to this event',
      required: false,
    }),
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'ID of the company related to this event',
      required: false,
    }),
    dealId: Property.ShortText({
      displayName: 'Deal ID',
      description: 'ID of the deal/pipeline record related to this event',
      required: false,
    }),
    attendees: Property.Array({
      displayName: 'Attendees',
      description: 'List of attendee email addresses',
      required: false,
      items: Property.ShortText({
        displayName: 'Email',
        description: 'Attendee email address',
      }),
    }),
  },
  run: async ({ auth, propsValue }) => {
    const {
      eventId,
      subject,
      description,
      startTime,
      endTime,
      location,
      eventType,
      isAllDay,
      reminder,
      contactId,
      companyId,
      dealId,
      attendees,
    } = propsValue;

    // Construct the API endpoint
    const baseUrl = auth.data?.['api_domain'] ? `${auth.data['api_domain']}/bigin/v2` : '';
    const endpoint = `${baseUrl}/events/${eventId}`;

    const eventData = {
      subject,
      description,
      start_time: startTime,
      end_time: endTime,
      location,
      event_type: eventType,
      is_all_day: isAllDay,
      reminder,
      contact_id: contactId,
      company_id: companyId,
      deal_id: dealId,
      attendees: attendees || [],
    };

    // Remove null/undefined values
    Object.keys(eventData).forEach(key => {
      if (eventData[key as keyof typeof eventData] === null || eventData[key as keyof typeof eventData] === undefined) {
        delete eventData[key as keyof typeof eventData];
      }
    });

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update event: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  },
}); 