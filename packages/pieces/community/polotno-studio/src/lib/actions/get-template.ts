import { Property, createAction } from '@activepieces/pieces-framework';
import { polotnoStudioAuth } from '../auth';
import { createClient } from '../common/client';
import { sharedProps } from '../common/props';
import type { Template } from '../common/types';

export const getTemplate = createAction({
  auth: polotnoStudioAuth,
  name: 'get_template',
  displayName: 'Get Template',
  description: 'Look up a single template by id.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a single Polotno Studio template by id, returning its name, tags and metadata. Leave Omit Design enabled unless the full design JSON is genuinely needed — it can be very large. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    template_id: { ...sharedProps.templateIdProp, description: 'The template to look up.' },
    omit_design: Property.Checkbox({
      displayName: 'Omit Design',
      description: 'Leave on to exclude the full design JSON, which can be several megabytes.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const client = createClient({ apiKey: context.auth.secret_text });
    const template = await client.request<Template>({
      path: `/v1/templates/${encodeURIComponent(context.propsValue.template_id)}`,
    });

    if (context.propsValue.omit_design === false) {
      return template;
    }

    const { polotno_json: _polotno_json, ...rest } = template;
    return rest;
  },
});
