import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';

export const listFormFiles = createAction({
  auth: jotformAuth,
  name: 'jotform_list_form_files',
  classification: 'SEARCH',
  displayName: 'List Form Files',
  description: "List a form's uploaded submission files.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists files uploaded to a form's submissions: URL, file name, size and the owning submission ID.",
    idempotent: true,
  },
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form, from List Forms.',
      required: true,
    }),
  },
  async run(context) {
    return jotformCommon.request({
      method: HttpMethod.GET,
      path: `/form/${context.propsValue.formId}/files`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
