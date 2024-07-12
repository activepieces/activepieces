import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../';
import {
  createCommonProps,
  createFormData,
  sendFormData,
} from '../common/send-utils';

export const sendEmail = createAction({
  auth: mailerooAuth,
  name: 'sendEmail',
  displayName: 'Send Email',
  description: 'Sends an email.',
  props: {
    ...createCommonProps(),
    content_type: Property.Dropdown<'text' | 'html'>({
      displayName: 'Content Type',
      refreshers: [],
      required: true,
      defaultValue: 'html',
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'Plain Text', value: 'text' },
            { label: 'HTML', value: 'html' },
          ],
        };
      },
    }),
    content: Property.ShortText({
      displayName: 'Content',
      description: 'HTML is only allowed if you selected HTML as type',
      required: true,
    }),
  },
  async run(context) {
    const formData = createFormData(context.propsValue);

    const { content_type, content } = context.propsValue;

    if (content_type === 'text') {
      formData.append('plain', content);
    } else if (content_type === 'html') {
      formData.append('html', content);
    }

    const res = await sendFormData('send', formData, context.auth.apiKey);

    return res.body;
  },
});
