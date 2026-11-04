import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../../../auth';
import { sendfoxClient } from '../../../common/client';
import { sendfoxGetContactFieldOutputSchema } from '../../../output-schemas';

export const getContactFieldAction = createAction({
  auth: sendfoxAuth,
  name: 'sendfox_get_contact_field',
  outputSchema: sendfoxGetContactFieldOutputSchema,
  displayName: 'Get Contact Field',
  description: 'Get one SendFox custom contact field',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one custom contact field by ID with its label, name and type. Field IDs come from List Contact Fields.',
    idempotent: true,
  },
  props: {
    fieldId: Property.ShortText({
      displayName: 'Field ID',
      description: 'ID of a custom contact field, e.g. "123". Use List Contact Fields to find it.',
      required: true,
    }),
  },
  async run(context) {
    const { propsValue } = context;
    return await sendfoxClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/contact-fields/${encodeURIComponent(propsValue.fieldId)}`,
    });
  },
});
