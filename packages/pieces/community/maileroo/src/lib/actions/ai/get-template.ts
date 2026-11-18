import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooGetTemplateOutputSchema } from '../../output-schemas';

export const mailerooGetTemplate = createAction({
  auth: mailerooAuth,
  name: 'maileroo_get_template',
  outputSchema: mailerooGetTemplateOutputSchema,
  displayName: 'Get Template',
  description: 'Gets a template with its HTML and plain text.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one template including its HTML and plain-text content. Get the template ID from maileroo_list_templates. Requires an Account Key connection.',
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
      method: HttpMethod.GET,
      path: `/templates/${encodeURIComponent(template_id)}`,
    });
  },
});
