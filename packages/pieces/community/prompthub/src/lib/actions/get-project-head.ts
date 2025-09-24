import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { PromptHubClient } from '../common/client';
import { getProjectHeadProps, getProjectHeadSchema, sanitizeVariables } from '../common/props';

export const getProjectHead = createAction({
  name: 'get_project_head',
  displayName: 'Get Project Head',
  description: 'Get the production-ready version of a PromptHub project (typically the last commit on master/main branch). Useful for integrating prompts into your application.',
  props: getProjectHeadProps,
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, getProjectHeadSchema);
    const client = new PromptHubClient(auth as string);
    const q: Record<string, any> = {};
    
    if (propsValue['branch']) {
      q['branch'] = propsValue['branch'];
    }
    
    if (propsValue['fallback'] !== undefined) {
      q['fallback'] = propsValue['fallback'] ? 1 : 0;
    }
    
    const vars = sanitizeVariables(propsValue['variables'] ?? {});
    for (const [k, v] of Object.entries(vars)) {
      q[`variables[${encodeURIComponent(k)}]`] = encodeURIComponent(String(v));
    }
    
    const result = await client.getProjectHead(propsValue['projectId'], q);
    const data = result?.data ?? result;
    
    return {
      id: data?.id,
      provider: data?.provider,
      model: data?.model,
      prompt: data?.prompt,
      system_message: data?.system_message,
      formatted_request: data?.formatted_request,
      hash: data?.hash,
      commit_title: data?.commit_title,
      commit_description: data?.commit_description,
      variables: data?.variables,
      project: data?.project,
      branch: data?.branch,
      configuration: data?.configuration,
    };
  },
});


