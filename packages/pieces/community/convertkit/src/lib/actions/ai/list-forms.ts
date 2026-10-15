import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient } from '../../common/client';
import { Form } from '../../common/types';
import { kitListFormsOutputSchema } from '../../output-schemas';

export const kitListForms = createAction({
  auth: convertkitAuth,
  name: 'kit_list_forms',
  classification: 'SEARCH',
  outputSchema: kitListFormsOutputSchema,
  displayName: 'List Forms',
  description: 'List the forms and landing pages on the account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists all forms and landing pages with their ID, name, type and embed URL. Use it to find a form ID for Add Subscriber To Form or List Form Subscriptions.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await kitClient.request<{ forms: Form[] }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/forms',
    });
    const forms = response.body.forms ?? [];
    return { forms, count: forms.length };
  },
});
