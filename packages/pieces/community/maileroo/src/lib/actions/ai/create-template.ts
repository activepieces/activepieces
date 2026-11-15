import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooCreateTemplateOutputSchema } from '../../output-schemas';

export const mailerooCreateTemplate = createAction({
  auth: mailerooAuth,
  name: 'maileroo_create_template',
  outputSchema: mailerooCreateTemplateOutputSchema,
  displayName: 'Create Template',
  description: 'Creates an email template from HTML, a URL or a zip.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates a template: type html needs a complete HTML document (starting with <!DOCTYPE html> and including <html> and <body>; a fragment is rejected), type url needs URL, type zip needs a base64 zip. Returns the new template; use its ID with the send actions. Not idempotent: each call creates another template. Requires an Account Key connection.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Template name, 1 to 128 characters.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Where the content comes from.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'HTML', value: 'html' },
          { label: 'URL', value: 'url' },
          { label: 'Zip (base64)', value: 'zip' },
        ],
      },
    }),
    html: Property.LongText({
      displayName: 'HTML',
      description: 'Required for type html.',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Required for type url.',
      required: false,
    }),
    zip_base64: Property.LongText({
      displayName: 'Zip (base64)',
      description: 'Required for type zip.',
      required: false,
    }),
  },
  async run(context) {
    const { name, type, html, url, zip_base64 } = context.propsValue;
    const content = { html, url, zip: zip_base64 }[type];
    if (!content) {
      throw new Error(`The content field matching type ${type} is required.`);
    }
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/templates',
      body: { name, type, ...(type === 'zip' ? { zip_base64 } : { [type]: content }) },
    });
  },
});
