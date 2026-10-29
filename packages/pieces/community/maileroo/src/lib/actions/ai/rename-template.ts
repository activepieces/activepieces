import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooSuccessOutputSchema } from '../../output-schemas';

export const mailerooRenameTemplate = createAction({
  auth: mailerooAuth,
  outputSchema: mailerooSuccessOutputSchema,
  name: 'maileroo_rename_template',
  displayName: 'Rename Template',
  description: 'Renames an email template.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Changes only the template name; the content is untouched. Get the template ID from maileroo_list_templates. Requires an Account Key connection.',
    idempotent: true,
  },
  props: {
    template_id: Property.Number({
      displayName: 'Template ID',
      description: 'Template ID from maileroo_list_templates.',
      required: true,
    }),
    template_name: Property.ShortText({
      displayName: 'New Name',
      description: '1 to 128 characters.',
      required: true,
    }),
  },
  async run(context) {
    const { template_id, template_name } = context.propsValue;
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.PATCH,
      path: `/templates/${encodeURIComponent(template_id)}`,
      body: {
        template_name,
      },
    });
  },
});
