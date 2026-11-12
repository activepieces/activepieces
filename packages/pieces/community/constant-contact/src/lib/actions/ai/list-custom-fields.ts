import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../../auth';
import { ccClient } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { customFieldsOutputSchema } from '../../common/output-schemas';

export const listCustomFieldsAiAction = createAction({
  auth: constantContactAuth,
  name: 'list_custom_fields_ai',
  classification: 'SEARCH',
  displayName: 'List Custom Fields',
  description: 'Lists the contact custom fields in the account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Constant Contact contact custom fields (custom_field_id, label, type, choices), one page at a time. Use the IDs as keys in the Custom Fields input of contact actions.',
    idempotent: true,
  },
  outputSchema: customFieldsOutputSchema,
  props: {
    limit: aiProps.limit({ max: 100, fallback: 50 }),
    cursor: aiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const page = await ccClient.listPage({
      accessToken: auth.access_token,
      path: '/contact_custom_fields',
      key: 'custom_fields',
      operation: 'list custom fields',
      query: { limit: aiInput.limit({ value: propsValue.limit, max: 100, fallback: 50 }), cursor: aiInput.cursor(propsValue.cursor) },
    });
    return { custom_fields: page.items, next_cursor: page.nextCursor };
  },
});
