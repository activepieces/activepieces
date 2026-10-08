import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { listTemplatesOutputSchema } from '../output-schemas';

export const listTemplates = createAction({
  name: 'list_templates',
  classification: 'SEARCH',
  auth: resendAuth,
  displayName: 'List Templates',
  outputSchema: listTemplatesOutputSchema,
  description: 'Retrieve all email templates in your Resend account',
  audience: 'ai',
  aiMetadata: { description: "Retrieves every email template defined on the account, including each one's status (draft or published) and alias. Use this to discover a template ID or check whether a suitable template already exists. Read-only and idempotent.", idempotent: true },
  props: {},
  async run({ auth }) {
    const response = await resendClient.sendRequest<{
      data: {
        id: string;
        name: string;
        status: string;
        published_at: string | null;
        created_at: string;
        updated_at: string;
        alias: string;
      }[];
    }>({ auth: auth.secret_text, method: HttpMethod.GET, path: '/templates' });
    return response.data;
  },
});
