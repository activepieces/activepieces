import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { PromptHubClient } from '../common/client';
import { runPromptProps, runPromptSchema, sanitizeVariables } from '../common/props';
import { prompthubAuth } from '../..';

export const runPrompt = createAction({
  name: 'run_prompt',
  displayName: 'Run Prompt',
  description: 'Run a PromptHub project with optional variables, branch/hash, and chat payload',
  audience: 'both',
  aiMetadata: { description: 'Execute a PromptHub project against its configured LLM and return the model completion. Use this to actually run a managed prompt rather than just read it; you can pin a specific version via branch or hash, supply variables for interpolation, and pass chat messages or an override prompt for the request. Not idempotent — each call invokes the model and incurs a new generation. Requires the numeric project ID.', idempotent: false },
  props: runPromptProps,
  auth: prompthubAuth,
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, runPromptSchema);
    const client = new PromptHubClient(auth.secret_text);
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


