import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurClient } from '../../common/client';
import type { ParseurRecord } from '../../common/types';
import { templateOutputSchema } from '../../output-schemas';

export const getTemplateAction = createAction({
  auth: parseurAuth,
  name: 'parseur_get_template',
  outputSchema: templateOutputSchema,
  displayName: 'Get Template',
  description: 'Gets one template with its fields.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one Parseur template by ID with its settings and the fields it extracts (template_object_set). Get the ID from List Templates.',
    idempotent: true,
  },
  props: {
    templateId: parseurAiProps.templateId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await parseurClient.request<ParseurRecord>({
      auth,
      method: HttpMethod.GET,
      path: `/template/${encodeURIComponent(propsValue.templateId)}`,
    });
  },
});
