import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxClient } from '../../../common/client';
import { boxGetAiAgentDefaultConfigOutputSchema } from '../../../output-schemas';

const MODES = ['ask', 'text_gen', 'extract', 'extract_structured'];

export const getAiAgentDefaultConfigAction = createAction({
  auth: boxAuth,
  name: 'box_get_ai_agent_default_config',
  outputSchema: boxGetAiAgentDefaultConfigOutputSchema,
  displayName: 'Get AI Agent Default Config',
  description: 'Gets the default Box AI agent configuration for a mode.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the default Box AI agent configuration (models, prompts, token limits) for one mode: ask, text_gen, extract or extract_structured. Edit the result and pass it as AI Agent to Ask Box AI, Generate Text with Box AI or the extract actions to override the defaults.',
    idempotent: true,
  },
  props: {
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description: '"ask", "text_gen", "extract" or "extract_structured".',
      required: true,
      options: { options: MODES.map((value) => ({ label: value, value })) },
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'ISO language code, e.g. "ja". Unsupported languages return the default config.',
      required: false,
    }),
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Model to return the config for, e.g. "azure__openai__gpt_4o_mini".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    if (!MODES.includes(propsValue.mode)) {
      throw new Error(`Mode must be one of: ${MODES.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/ai_agent_default',
      query: { mode: propsValue.mode, language: propsValue.language, model: propsValue.model },
    });
  },
});
