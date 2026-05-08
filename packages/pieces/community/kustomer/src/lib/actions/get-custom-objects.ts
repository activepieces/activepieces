import { createAction, Property } from '@activepieces/pieces-framework';

import { kustomerAuth } from '../common/auth';
import { kustomerClient } from '../common/client';
import { KustomerJsonObject, KustomerJsonValue } from '../common/types';

export const getCustomObjectsAction = createAction({
  auth: kustomerAuth,
  name: 'get-custom-objects',
  displayName: 'Get Custom Objects',
  description:
    'Retrieves all custom objects (KObjects) for a given class in Kustomer.',
  props: {
    klassName: Property.ShortText({
      displayName: 'KObject Class Name',
      description:
        'The API name of the custom object class to fetch (e.g. "order", "ticket"). You can find this in Kustomer under Settings > Custom Objects — it is the lowercase identifier, not the display label.',
      required: true,
    }),
    fromDate: Property.ShortText({
      displayName: 'From Date',
      description:
        'Only return objects created or updated on or after this date. Use ISO 8601 format (e.g. "2024-01-15T00:00:00.000Z"). Leave empty to return all objects.',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text as string;
    const { klassName, fromDate } = context.propsValue;

    const response = await kustomerClient.getCustomObjects({
      apiKey,
      klassName,
      ...(fromDate ? { fromDate } : {}),
    });

    return response;
  },
});
