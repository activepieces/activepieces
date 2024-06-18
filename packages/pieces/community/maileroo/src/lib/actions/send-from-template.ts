import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../';
import {
  createCommonProps,
  createFormData,
  sendFormData,
} from '../common/send-utils';

export const sendFromTemplate = createAction({
  auth: mailerooAuth,
  name: 'sendFromTemplate',
  displayName: 'Send Email using Template',
  description: 'Sends an email from an existing template.',
  props: {
    ...createCommonProps(),
    template_id: Property.Number({
      displayName: 'Template ID',
      description: 'The ID of the template to use',
      required: true,
    }),
    template_data: Property.Object({
      displayName: 'Template Data',
      description:
        'Data to fill in the template. The string `{{name}}` in the template body will be replaced with the value of `name`',
      required: true,
    }),
  },
  async run(context) {
    const formData = createFormData(context.propsValue);

    const { template_id, template_data } = context.propsValue;

    formData.append('template_id', template_id);
    formData.append('template_data', JSON.stringify(template_data));

    const res = await sendFormData(
      'send-template',
      formData,
      context.auth.apiKey
    );

    return res.body;
  },
});
