import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../common/auth';
import { BiginClient } from '../common/client';
import { COMMON_FIELDS, cleanupData, formatDateTimeForBigin } from '../common/utils';

export const updateEventAction = createAction({
  auth: biginAuth,
  name: 'update_event',
  displayName: 'Update Event',
  description: 'Update an existing event in Bigin CRM',
  props: {
    eventId: Property.ShortText({
      displayName: 'Event ID',
      description: 'ID of the event to update',
      required: true
    }),
    eventTitle: Property.ShortText({
      displayName: 'Event Title',
      description: 'Title of the event',
      required: false
    }),
    startDateTime: Property.DateTime({
      displayName: 'Start Date & Time',
      description: 'Start date and time of the event',
      required: false
    }),
    endDateTime: Property.DateTime({
      displayName: 'End Date & Time',
      description: 'End date and time of the event',
      required: false
    }),
    allDay: Property.Checkbox({
      displayName: 'All Day Event',
      description: 'Whether this is an all-day event',
      required: false
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
      eventId,
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
      // Build event data (only include fields that are provided)
      const eventData = cleanupData({
        [COMMON_FIELDS.EVENT.EVENT_TITLE]: eventTitle,
        [COMMON_FIELDS.EVENT.START_DATETIME]: startDateTime ? formatDateTimeForBigin(startDateTime) : undefined,
        [COMMON_FIELDS.EVENT.END_DATETIME]: endDateTime ? formatDateTimeForBigin(endDateTime) : undefined,
        [COMMON_FIELDS.EVENT.ALL_DAY]: allDay,
        [COMMON_FIELDS.EVENT.VENUE]: venue,
        [COMMON_FIELDS.EVENT.DESCRIPTION]: description,
        [COMMON_FIELDS.EVENT.RELATED_TO]: relatedTo
      });

      // Update event
      const response = await client.updateEvent(eventId, eventData);

      return {
        success: true,
        data: response.data?.[0] || response,
        message: 'Event updated successfully'
      };
    } catch (error: any) {
      throw new Error(`Failed to update event: ${error.message}`);
    }
  }
});
