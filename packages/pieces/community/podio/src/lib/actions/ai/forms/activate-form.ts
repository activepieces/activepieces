import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const activateFormAction = createAction({
  auth: podioAuth,
  name: 'podio_activate_form',
  displayName: 'Activate Form',
  description: 'Turns a disabled web form back on.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Enables a disabled Podio web form so people can create items in its app through it again. Only disabled forms can be activated; Deactivate Form is the reverse. The form id comes from List Forms or Create Form.',
    idempotent: true,
  },
  props: {
    formId: podioAiProps.id({ required: true, displayName: 'Form ID', description: 'The id of the form, from List Forms or Create Form.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/form/${propsValue.formId}/activate` });
  },
});
