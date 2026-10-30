import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooSuccessOutputSchema } from '../../output-schemas';

export const mailerooDeleteTemplate = createAction({
  auth: mailerooAuth,
  outputSchema: mailerooSuccessOutputSchema,
  name: 'maileroo_delete_template',
  displayName: 'Delete Template',
  description: 'Deletes an email template.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes a template; sends that reference it will fail. Get the template ID from maileroo_list_templates. Hard delete. Requires an Account Key connection.',
    idempotent: true,
  },
  props: {
    template_id: Property.Number({
      displayName: 'Template ID',
      description: 'Template ID from maileroo_list_templates.',
      required: true,
    }),
  },
  async run(context) {
    const { template_id } = context.propsValue;
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/templates/${encodeURIComponent(template_id)}`,
    });
  },
});
