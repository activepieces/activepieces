import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurClient } from '../../common/client';
import type { ParseurRecord } from '../../common/types';
import { customDownloadOutputSchema } from '../../output-schemas';

export const updateCustomDownloadAction = createAction({
  auth: parseurAuth,
  name: 'parseur_update_custom_download',
  outputSchema: customDownloadOutputSchema,
  displayName: 'Update Custom Download',
  description: 'Changes a custom download\'s name, type or columns.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes the name, type or columns you set on a Parseur custom download and leaves the rest as they are. Columns replaces the whole column list. Get both IDs from List Custom Downloads. Returns the updated download.',
    idempotent: true,
  },
  props: {
    mailboxId: parseurAiProps.mailboxId({ required: true }),
    customDownloadId: parseurAiProps.customDownloadId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name of the download.',
      required: false,
    }),
    type: parseurAiProps.customDownloadType({ required: false }),
    tableFieldId: parseurAiProps.tableFieldId({ required: false }),
    items: parseurAiProps.downloadItems({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.type === 'PARSER_FIELD' && !propsValue.tableFieldId) {
      throw new Error('Table Field ID is required when Type is PARSER_FIELD.');
    }
    const items =
      propsValue.items && propsValue.items.length > 0
        ? propsValue.items
        : undefined;
    const body = Object.fromEntries(
      Object.entries({
        name: propsValue.name,
        type: propsValue.type,
        parser_field_id: propsValue.tableFieldId,
        items,
      }).filter(([, value]) => value !== undefined)
    );
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one of Name, Type, Table Field ID or Columns.');
    }
    return await parseurClient.request<ParseurRecord>({
      auth,
      method: HttpMethod.PATCH,
      path: `/parser/${encodeURIComponent(propsValue.mailboxId)}/export_config/${encodeURIComponent(propsValue.customDownloadId)}`,
      body,
    });
  },
});
