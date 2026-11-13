import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurClient } from '../../common/client';
import { parseurUtils } from '../../common/utils';
import type { ParseurPage, ParseurRecord } from '../../common/types';
import { templateListOutputSchema } from '../../output-schemas';

export const listTemplatesAction = createAction({
  auth: parseurAuth,
  name: 'parseur_list_templates',
  outputSchema: templateListOutputSchema,
  displayName: 'List Templates',
  description: 'Lists the templates in a mailbox.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the templates of one Parseur mailbox with their ID, name, engine, status (DRAFT or PROD) and document count. Templates are made in the Parseur app; use this to get a template ID for Get, Copy or Delete Template.',
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
      path: `/parser/${encodeURIComponent(propsValue.mailboxId)}/template_set`,
      query: parseurUtils.pageQuery({
        page: propsValue.page,
        limit: propsValue.limit,
      }),
    });
  },
});
