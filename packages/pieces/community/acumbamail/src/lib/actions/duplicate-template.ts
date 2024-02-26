import { acumbamailAuth } from '../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import { acumbamailCommon } from '../common';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import FormData from 'form-data';

export const duplicateTemplateAction = createAction({
  auth: acumbamailAuth,
  name: 'acumbamail_duplicate_template',
  displayName: 'Duplicate Template',
  description:
    'Duplicates an existing template to use it on a email marketing campaign shipping.',
  props: {
    template_name: Property.ShortText({
      displayName: 'New Template Name',
      required: true,
    }),
    templateId: acumbamailCommon.templateId,
  },
  async run(context) {
    const { templateId, template_name } = context.propsValue;

    const formData = new FormData();
    formData.append('auth_token', context.auth);
    formData.append('template_name', template_name);
    formData.append('origin_template_id', templateId.toString());

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: acumbamailCommon.baseUrl + '/duplicateTemplate/',
      headers: formData.getHeaders(),
      body: formData,
    };

    const res = await httpClient.sendRequest(request);
    return res.body;
  },
});
