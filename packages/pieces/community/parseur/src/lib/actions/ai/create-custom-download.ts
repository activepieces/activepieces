import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurClient } from '../../common/client';
import type { ParseurRecord } from '../../common/types';
import { customDownloadOutputSchema } from '../../output-schemas';

export const createCustomDownloadAction = createAction({
  auth: parseurAuth,
  name: 'parseur_create_custom_download',
  outputSchema: customDownloadOutputSchema,
  displayName: 'Create Custom Download',
  description: 'Creates a custom CSV/Excel download for a mailbox.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a custom download on a Parseur mailbox: a saved CSV and Excel export of the chosen columns. Returns it with its ID and its csv_download and xls_download links. Type PARSER_FIELD needs Table Field ID. Every call creates another download.',
    idempotent: false,
  },
  props: {
    mailboxId: parseurAiProps.mailboxId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the download.',
      required: true,
    }),
    type: parseurAiProps.customDownloadType({ required: true }),
    tableFieldId: parseurAiProps.tableFieldId({ required: false }),
    items: parseurAiProps.downloadItems({ required: true }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.type === 'PARSER_FIELD' && !propsValue.tableFieldId) {
      throw new Error('Table Field ID is required when Type is PARSER_FIELD.');
    }
    if (propsValue.type === 'PARSER' && propsValue.tableFieldId) {
      throw new Error('Table Field ID is only for Type PARSER_FIELD.');
    }
    return await parseurClient.request<ParseurRecord>({
      auth,
      method: HttpMethod.POST,
      path: `/parser/${encodeURIComponent(propsValue.mailboxId)}/export_config`,
      body: {
        name: propsValue.name,
        type: propsValue.type,
        parser_field_id: propsValue.tableFieldId,
        items: propsValue.items,
      },
    });
  },
});
