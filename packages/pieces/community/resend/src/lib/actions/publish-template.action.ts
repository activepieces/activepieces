import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { publishTemplateOutputSchema } from '../output-schemas';

export const publishTemplate = createAction({
  name: 'publish_template',
  classification: 'WRITE',
  auth: resendAuth,
  displayName: 'Publish Template',
  outputSchema: publishTemplateOutputSchema,
  description: "Make a template's latest version live",
  audience: 'ai',
  aiMetadata: { description: 'Publishes the current draft version of a template, identified by ID or alias, making it the version used when the template is referenced elsewhere. Use this after Create Template or Update Template once the content is ready to go live. Idempotent — publishing an already-published version with no pending changes is a no-op.', idempotent: true },
  props: {
    template_id: resendProps.templateId,
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest<{ object: string; id: string }>({ auth: auth.secret_text, method: HttpMethod.POST, path: `/templates/${propsValue.template_id}/publish` });
  },
});
