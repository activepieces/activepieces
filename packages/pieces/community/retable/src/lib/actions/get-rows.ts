import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableGetRowsAction = createAction({
  auth: retableAuth,
  name: 'retable_get_rows',
  classification: 'SEARCH',
  displayName: 'Get Rows',
  description: 'Gets rows from a retable, optionally by row id',
  audience: 'ai',
  aiMetadata: { description: 'Reads rows from a Retable table. Use v1 format for column_id-keyed cell values, or v2 for flattened column-title keys. Optionally filter to specific row ids (comma-separated, max 50); omit to get all rows. Idempotent read.', idempotent: true },
  props: {
    retable_id: Property.ShortText({
      displayName: 'Retable ID',
      description: 'ID of the retable, from Get Specific Table or Get Retables',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'v1 returns cells keyed by column_id, v2 returns cells keyed by column title',
      required: false,
      defaultValue: 'v1',
      options: {
        options: [
          { label: 'v1 (column ids)', value: 'v1' },
          { label: 'v2 (column titles)', value: 'v2' },
        ],
      },
    }),
    row_id: Property.ShortText({
      displayName: 'Row IDs',
      description: 'Comma-separated row ids to fetch (max 50). Leave empty to get all rows.',
      required: false,
    }),
  },
  async run(context) {
    const { retable_id, format, row_id } = context.propsValue;
    const url =
      format === 'v2'
        ? `https://api.retable.io/v2/public/retable/${retable_id}/data`
        : `${retableCommon.baseUrl}/retable/${retable_id}/data`;
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url,
        headers: {
          ApiKey: context.auth.secret_text,
        },
        queryParams: row_id ? { row_id } : {},
      })
    ).body;
  },
});
