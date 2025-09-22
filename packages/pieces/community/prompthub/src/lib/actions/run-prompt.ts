import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { PromptHubAuth } from "../common/auth";

export const runPrompt = createAction({
  auth: PromptHubAuth,
  name: 'runPrompt',
  displayName: 'Run Prompt',
  description: 'Run a prompt from your PromptHub library.',
  props: {
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of the PromptHub project to run.',
      required: true,
    }),
    branch: Property.ShortText({
      displayName: 'Branch',
      description: 'Optional branch to run the prompt from.',
      required: false,
    }),
    hash: Property.ShortText({
      displayName: 'Commit Hash',
      description: 'Optional commit hash to run the prompt from.',
      required: false,
    }),
    variables: Property.Json({
      displayName: 'Variables',
      description: 'JSON object of variables to pass into the prompt (key-value pairs).',
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const { projectId, branch, hash, variables } = propsValue;

    const query: Record<string, string> = {};
    if (branch) query['branch'] = branch;
    if (hash) query['hash'] = hash;

    const body = variables ? { variables } : {};

    const result = await makeRequest(
      auth,
      HttpMethod.POST,
      `/projects/${projectId}/run`,
      body,
      query
    );

    return result;
  },
});
