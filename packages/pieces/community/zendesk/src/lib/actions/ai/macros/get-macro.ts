import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskGetMacroOutputSchema } from '../../../output-schemas';

export const zendeskGetMacro = createAction({
  auth: zendeskAuth,
  name: 'zendesk_get_macro',
  outputSchema: zendeskGetMacroOutputSchema,
  displayName: 'Get Macro',
  description: 'Get a macro by its ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches one macro with its title, description and the actions it applies (comment text, status, tags, fields).',
    idempotent: true,
  },
  props: {
    macro_id: zendeskAiProps.requiredId({ displayName: 'Macro ID', description: 'Numeric macro ID, from List Macros or Search Macros.' }),
  },
  async run({ auth, propsValue }) {
    const macroId = zendeskApi.id({ value: propsValue.macro_id, label: 'Macro ID' });
    const response = await zendeskApi.request<{ macro: Record<string, unknown> }>({
      auth,
      method: HttpMethod.GET,
      path: `/macros/${macroId}.json`,
    });
    return response.macro;
  },
});
