import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { duplicateTemplateOutputSchema } from '../output-schemas';

export const duplicateTemplate = createAction({
  name: 'duplicate_template',
  classification: 'WRITE',
  auth: resendAuth,
  displayName: 'Duplicate Template',
  outputSchema: duplicateTemplateOutputSchema,
  description: 'Create a copy of an existing template',
  audience: 'ai',
  aiMetadata: { description: "Creates a new template that is a copy of an existing one, identified by ID or alias, and returns the new template's ID. Use this to start a variant of an existing template without modifying the original. Not idempotent — each call creates a new duplicate.", idempotent: false },
  props: {
    template_id: resendProps.templateId,
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest<{ object: string; id: string }>({ auth: auth.secret_text, method: HttpMethod.POST, path: `/templates/${propsValue.template_id}/duplicate` });
  },
});
