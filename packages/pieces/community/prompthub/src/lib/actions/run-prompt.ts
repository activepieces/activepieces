import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { PromptHubClient } from '../common/client';
import { runPromptProps, runPromptSchema, sanitizeVariables } from '../common/props';

export const runPrompt = createAction({
  name: 'run_prompt',
  displayName: 'Run Prompt',
  description: 'Run a PromptHub project with optional variables, branch/hash, and chat payload',
  props: runPromptProps,
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, runPromptSchema);
    const client = new PromptHubClient(auth as string);
    const body: Record<string, any> = {};
    if (propsValue['branch']) body['branch'] = propsValue['branch'];
    if (propsValue['hash']) body['hash'] = propsValue['hash'];
    if (propsValue['variables']) body['variables'] = sanitizeVariables(propsValue['variables']);
    if (propsValue['messages']) body['messages'] = propsValue['messages'];
    if (propsValue['prompt']) body['prompt'] = propsValue['prompt'];
    if (propsValue['metadata']) body['metadata'] = propsValue['metadata'];
    const timeoutMs = propsValue['timeoutSeconds'] ? propsValue['timeoutSeconds'] * 1000 : undefined;
    const result = await client.runProject(propsValue['projectId'], body, timeoutMs);
    return result?.data ?? result;
  },
});


