import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { joggAiAuth } from '../../..';
import { joggAiClient } from '../../common/client';
import { joggAiOutputSchemas } from '../../common/output-schemas';

export const aiListTemplates = createAction({
  auth: joggAiAuth,
  name: 'ai_list_templates',
  displayName: 'List Templates',
  description: 'Lists your custom video templates.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: joggAiOutputSchemas.aiListTemplates,
  aiMetadata: {
    description:
      'Lists the account custom video templates, optionally filtered by aspect ratio. Use it to find a template_id for Get Template or Create Template Video. Read-only.',
    idempotent: true,
  },
  props: {
    aspect_ratio: Property.StaticDropdown({
      displayName: 'Aspect Ratio',
      description: 'Only templates with this aspect ratio.',
      required: false,
      options: {
        options: [
          { label: 'Portrait (9:16)', value: 'portrait' },
          { label: 'Landscape (16:9)', value: 'landscape' },
          { label: 'Square (1:1)', value: 'square' },
        ],
      },
    }),
  },
  async run(context) {
    const data = await joggAiClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/templates/custom',
      op: 'list templates',
      queryParams: joggAiClient.compact({ aspect_ratio: context.propsValue.aspect_ratio }),
    });
    return {
      templates: joggAiClient
        .listOf({ value: data, key: 'templates' })
        .map((template) => ({ ...template, template_id: template['template_id'] ?? template['id'] })),
    };
  },
});
