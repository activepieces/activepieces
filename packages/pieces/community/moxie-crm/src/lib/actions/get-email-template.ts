import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieRequest } from '../common/client';
import { moxieInput } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieGetEmailTemplateAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_get_email_template',
  classification: 'READ',
  displayName: 'Get Email Template',
  description: 'Get the subject and HTML content of an email template.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the subject and raw HTML content of a Moxie email template by id; merge tokens are returned as written, not filled in. Use to reuse Moxie email wording in another tool. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.emailTemplate,
  props: {
    templateId: Property.ShortText({
      displayName: 'Template ID',
      description: 'Template id, from List Email Templates.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.GET,
      path: `/action/emailTemplates/${encodeURIComponent(moxieInput.id({ value: propsValue.templateId, field: 'Template ID' }))}`,
      notFoundMessage: 'Email template not found in this Moxie workspace.',
    });
  },
});
