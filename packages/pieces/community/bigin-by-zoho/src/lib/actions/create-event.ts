import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../common/auth';
import { BiginClient } from '../common/client';
import { COMMON_FIELDS, validateRequiredFields, cleanupData, formatDateTimeForBigin } from '../common/utils';

export const createEventAction = createAction({
  auth: biginAuth,
  name: 'create_event',
  displayName: 'Create Event',
  description: 'Create a new event in Bigin CRM',
  props: {
    eventTitle: Property.ShortText({
      displayName: 'Event Title',
      description: 'Title of the event',
      required: true
    }),
    startDateTime: Property.DateTime({
      displayName: 'Start Date & Time',
      description: 'Start date and time of the event',
      required: true
    }),
    endDateTime: Property.DateTime({
      displayName: 'End Date & Time',
      description: 'End date and time of the event',
      required: true
    }),
    allDay: Property.Checkbox({
      displayName: 'All Day Event',
      description: 'Whether this is an all-day event',
      required: false,
      defaultValue: false
    }),
    venue: Property.ShortText({
      displayName: 'Venue',
      description: 'Location or venue of the event',
      required: false
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description or notes about the event',
      required: false
    }),
    relatedTo: Property.ShortText({
      displayName: 'Related To',
      description: 'ID of the related record (Contact, Company, Deal, etc.)',
      required: false
    })
  },
  async run(context) {
    const {
      eventTitle,
      startDateTime,
      endDateTime,
      allDay,
      venue,
      description,
      relatedTo
    } = context.propsValue;

    const client = new BiginClient(context.auth);

    try {
      // Validate required fields
      validateRequiredFields({ eventTitle, startDateTime, endDateTime }, ['eventTitle', 'startDateTime', 'endDateTime']);

      // Build event data
      const eventData = cleanupData({
        [COMMON_FIELDS.EVENT.EVENT_TITLE]: eventTitle,
        [COMMON_FIELDS.EVENT.START_DATETIME]: formatDateTimeForBigin(startDateTime),
        [COMMON_FIELDS.EVENT.END_DATETIME]: formatDateTimeForBigin(endDateTime),
        [COMMON_FIELDS.EVENT.ALL_DAY]: allDay,
        [COMMON_FIELDS.EVENT.VENUE]: venue,
        [COMMON_FIELDS.EVENT.DESCRIPTION]: description,
        [COMMON_FIELDS.EVENT.RELATED_TO]: relatedTo
      });

      // Create event
      const response = await client.createEvent(eventData);

      return {
        success: true,
        data: response.data?.[0] || response,
        message: 'Event created successfully'
      };
    } catch (error: any) {
      throw new Error(`Failed to create event: ${error.message}`);
    }
  }
});
