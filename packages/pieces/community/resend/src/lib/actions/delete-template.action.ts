import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { deleteTemplateOutputSchema } from '../output-schemas';

export const deleteTemplate = createAction({
  name: 'delete_template',
  classification: 'DESTRUCTIVE',
  auth: resendAuth,
  displayName: 'Delete Template',
  outputSchema: deleteTemplateOutputSchema,
  description: 'Permanently remove an email template',
  audience: 'ai',
  aiMetadata: { description: 'Permanently deletes an email template, identified by ID or alias. Effectively idempotent — once deleted, repeating the call has no further effect.', idempotent: true },
  props: {
    template_id: resendProps.templateId,
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest<{ object: string; id: string; deleted: boolean }>({ auth: auth.secret_text, method: HttpMethod.DELETE, path: `/templates/${propsValue.template_id}` });
  },
});
