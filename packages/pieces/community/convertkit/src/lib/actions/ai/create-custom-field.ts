import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient } from '../../common/client';
import { CustomField } from '../../common/types';
import { kitCustomFieldOutputSchema } from '../../output-schemas';

export const kitCreateCustomField = createAction({
  auth: convertkitAuth,
  name: 'kit_create_custom_field',
  classification: 'WRITE',
  outputSchema: kitCustomFieldOutputSchema,
  displayName: 'Create Custom Field',
  description: 'Create a custom subscriber field.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one custom subscriber field from a label; Kit derives its key (lowercase, underscored) and returns it. Labels must be unique and the account allows at most 140 fields. Check List Custom Fields first, because a retry with an existing label fails.',
    idempotent: false,
  },
  props: {
    label: Property.ShortText({
      displayName: 'Label',
      description: 'The field label, e.g. "Company". Must be unique on the account.',
      required: true,
    }),
  },
  async run(context) {
    const label = context.propsValue.label.trim();
    if (!label) {
      throw new Error('Label cannot be empty.');
    }
    const response = await kitClient.request<CustomField>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/custom_fields',
      body: { label },
    });
    return response.body;
  },
});
