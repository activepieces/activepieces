import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetItemFieldCalendarAsIcalOutputSchema } from '../../../output-schemas';

export const getItemFieldCalendarAsIcalAction = createAction({
  auth: podioAuth,
  name: 'podio_get_item_field_calendar_as_ical',
  outputSchema: podioGetItemFieldCalendarAsIcalOutputSchema,
  displayName: 'Get Item Field Calendar as iCal',
  description: 'Gets the date of one item date field as an iCal (.ics) event.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the date in one date field of one Podio item as iCal (text/calendar) text, for adding it to another calendar tool. The item id comes from Filter Items or Get Item, and the date field id from Get App.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item.' }),
    fieldId: podioAiProps.id({ required: true, displayName: 'Field ID', description: 'The id of a date field of the item.' }),
  },
  async run({ auth, propsValue }) {
    const ical = await podioClient.request<string>({ auth, method: HttpMethod.GET, path: `/calendar/item/${propsValue.itemId}/field/${propsValue.fieldId}/ics/` });
    return { ical };
  },
});
