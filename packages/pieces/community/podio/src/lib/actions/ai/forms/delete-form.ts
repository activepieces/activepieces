import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const deleteFormAction = createAction({
  auth: podioAuth,
  name: 'podio_delete_form',
  displayName: 'Delete Form',
  description: 'Permanently deletes a web form.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a Podio web form; items it already created stay in the app. To only stop the form from accepting entries, use Deactivate Form, which can be undone. The form id comes from List Forms or Create Form.',
    idempotent: false,
  },
  props: {
    formId: podioAiProps.id({ required: true, displayName: 'Form ID', description: 'The id of the form, from List Forms or Create Form.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/form/${propsValue.formId}` });
  },
});
