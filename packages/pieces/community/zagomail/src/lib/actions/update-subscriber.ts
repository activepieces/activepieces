import { zagomailAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { zagoMailApiService } from '../common/request';
import { listFields, listUId } from '../common/props';
import { isNil } from '@activepieces/shared';
import dayjs from 'dayjs';

export const updateSubscriber = createAction({
  auth: zagomailAuth,
  name: 'updateSubscriber',
  displayName: 'Update Subscriber',
  description: 'Updates an existing subscriber.',
  audience: 'both',
  aiMetadata: { description: 'Updates the custom fields of an existing subscriber in a Zagomail list, targeting it by list UID and subscriber UID. Use to change a contact details after creation. Idempotent: repeating the call with the same field values leaves the subscriber in the same state.', idempotent: true },
  props: {
    listUId: listUId,
    subsriberUid: Property.ShortText({
      displayName: 'Subscriber ID',
      description: 'The ID of the subscriber you want to update.',
      required: true,
    }),
    fields: listFields(false),
  },
  async run({ propsValue, auth }) {
    const listUId = propsValue.listUId;
    const subsriberUid = propsValue.subsriberUid;
    const listFields = propsValue.fields ?? {};

    const payload: Record<string, any> = {};

    for (const [key, value] of Object.entries(listFields)) {
      if (isNil(value) || value === '') continue;

      const [field, type] = key.split(':::');

      let formattedValue = value;

      if (type === 'Date') {
        formattedValue = dayjs(value).format('YYYY-MM-DD');
      } else if (type === 'Datetime') {
        formattedValue = dayjs(value).format('YYYY-MM-DD HH:mm:ss');
      }

      payload[field] = formattedValue;
    }

    return await zagoMailApiService.updateSubscriber(
      auth.secret_text,
      listUId,
      subsriberUid,
      payload
    );
  },
});
