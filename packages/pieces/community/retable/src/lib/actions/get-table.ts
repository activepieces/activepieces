import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableGetTableAction = createAction({
  auth: retableAuth,
  name: 'retable_get_table',
  classification: 'READ',
  displayName: 'Get Specific Table',
  description: 'Gets metadata and column definitions for a retable',
  audience: 'ai',
  aiMetadata: { description: 'Reads a Retable table\'s metadata and column definitions (ids, titles, types). Use before inserting or updating rows to resolve column ids. Idempotent read.', idempotent: true },
  props: {
    retable_id: Property.ShortText({
      displayName: 'Retable ID',
      description: 'ID of the retable, from Get Retables or Get Specific Project',
      required: true,
    }),
  },
  async run(context) {
    const { retable_id } = context.propsValue;
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${retableCommon.baseUrl}/retable/${retable_id}`,
        headers: {
          ApiKey: context.auth.secret_text,
        },
      })
    ).body;
  },
});
