import { createAction } from '@activepieces/pieces-framework';
import { polotnoStudioAuth } from '../auth';
import { createClient } from '../common/client';
import { templateIdProp } from '../common/props';
import type { TemplateSummary } from '../common/types';

export const getTemplate = createAction({
  auth: polotnoStudioAuth,
  name: 'get_template',
  displayName: 'Get Template',
  description: 'Look up a single template by id.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a single Polotno Studio template by id, returning its full details — name, tags, metadata and design JSON. Choose this to look up a specific template when you already have its id. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    // GET /v1/templates/{id} has no omit_design parameter (that only exists on the
    // list endpoint), so this always returns the full template including its design.
    template_id: { ...templateIdProp, description: 'The template to look up.' },
  },
  async run(context) {
    const client = createClient(context.auth.secret_text);
    return client.request<TemplateSummary>({
      path: `/v1/templates/${encodeURIComponent(context.propsValue.template_id)}`,
    });
  },
});
