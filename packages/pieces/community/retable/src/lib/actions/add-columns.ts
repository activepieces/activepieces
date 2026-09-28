import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableAddColumnsAction = createAction({
  auth: retableAuth,
  name: 'retable_add_columns',
  classification: 'WRITE',
  displayName: 'Add Columns',
  description: 'Adds one or more columns to a retable',
  audience: 'ai',
  aiMetadata: { description: 'Adds new typed columns to a Retable table. Each column needs a title and a type (text, number, checkbox, image, calendar, color, email, phonenumber, or percent). Not idempotent — re-running adds duplicate columns.', idempotent: false },
  props: {
    retable_id: retableCommon.retable_id(),
    columns: Property.Json({
      displayName: 'Columns',
      description: 'Array of columns to add, e.g. [{"title":"Email","type":"email"}]',
      required: true,
    }),
  },
  async run(context) {
    const { retable_id, columns } = context.propsValue;
    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${retableCommon.baseUrl}/retable/${retable_id}/column`,
        headers: {
          ApiKey: context.auth.secret_text,
        },
        body: {
          columns,
        },
      })
    ).body;
  },
});
