import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../../../auth';
import { sendfoxClient } from '../../../common/client';
import { sendfoxGetFormOutputSchema } from '../../../output-schemas';

export const getFormAction = createAction({
  auth: sendfoxAuth,
  name: 'sendfox_get_form',
  outputSchema: sendfoxGetFormOutputSchema,
  displayName: 'Get Form',
  description: 'Get one SendFox signup form',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one signup form by ID with its title, URL, redirect URL, GDPR setting and the lists it adds contacts to. Form IDs come from List Forms.',
    idempotent: true,
  },
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'ID of a signup form, e.g. "54321". Use List Forms to find it.',
      required: true,
    }),
  },
  async run(context) {
    const { propsValue } = context;
    return await sendfoxClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/forms/${encodeURIComponent(propsValue.formId)}`,
    });
  },
});
