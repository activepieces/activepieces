import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const deactivateFormAction = createAction({
  auth: podioAuth,
  name: 'podio_deactivate_form',
  displayName: 'Deactivate Form',
  description: 'Turns off a web form so it no longer creates items.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Disables a Podio web form: it stops creating items and shows a "form disabled" message instead. Reversible with Activate Form, so prefer it over Delete Form. The form id comes from List Forms or Create Form.',
    idempotent: true,
  },
  props: {
    formId: podioAiProps.id({ required: true, displayName: 'Form ID', description: 'The id of the form, from List Forms or Create Form.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/form/${propsValue.formId}/deactivate` });
  },
});
