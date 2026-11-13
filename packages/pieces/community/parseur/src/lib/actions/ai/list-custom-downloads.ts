import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurClient } from '../../common/client';
import { parseurUtils } from '../../common/utils';
import type { ParseurPage, ParseurRecord } from '../../common/types';
import { customDownloadListOutputSchema } from '../../output-schemas';

export const listCustomDownloadsAction = createAction({
  auth: parseurAuth,
  name: 'parseur_list_custom_downloads',
  outputSchema: customDownloadListOutputSchema,
  displayName: 'List Custom Downloads',
  description: 'Lists a mailbox\'s custom CSV/Excel downloads.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the custom downloads of one Parseur mailbox: saved CSV and Excel exports of its parsed data, each with its columns and its csv_download and xls_download links. Use it to get a download link or a custom download ID for Update or Delete Custom Download.',
    idempotent: true,
  },
  props: {
    mailboxId: parseurAiProps.mailboxId({ required: true }),
    page: parseurAiProps.page({ required: false }),
    limit: parseurAiProps.limit({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await parseurClient.request<ParseurPage<ParseurRecord>>({
      auth,
      method: HttpMethod.GET,
      path: `/parser/${encodeURIComponent(propsValue.mailboxId)}/export_config`,
      query: parseurUtils.pageQuery({
        page: propsValue.page,
        limit: propsValue.limit,
      }),
    });
  },
});
