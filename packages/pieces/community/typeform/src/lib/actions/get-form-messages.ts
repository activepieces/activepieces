import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformRecord } from '../common';

export const getFormMessagesAction = createAction({
  auth: typeformAuth,
  name: 'get_form_messages',
  classification: 'READ',
  displayName: 'Get Form Messages',
  description: 'Gets the button labels, error messages and other texts of a form.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get the custom interface texts of a Typeform form (button labels, error messages, placeholders), keyed like "label.buttonHint.default". Use it to see the keys before Update Form Messages. Read-only.',
    idempotent: true,
  },
  props: {
    form_id: typeformCommon.formId,
  },
  async run({ auth, propsValue }) {
    return typeformCommon.typeformRequest<TypeformRecord>({
      token: auth.access_token,
      method: HttpMethod.GET,
      path: `/forms/${encodeURIComponent(propsValue.form_id)}/messages`,
    });
  },
});
