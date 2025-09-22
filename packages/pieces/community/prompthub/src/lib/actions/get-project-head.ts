import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { PromptHubAuth } from "../common/auth";

export const getProjectHead = createAction({
  auth: PromptHubAuth,
  name: 'getProjectHead',
  displayName: 'Get Project Head',
  description: 'Fetches the head revision of a PromptHub project by ID.',
  props: {
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of the PromptHub project.',
      required: true,
    }),
    branch: Property.ShortText({
      displayName: 'Branch',
      description: 'Optional branch name to fetch the head from (defaults to master/main).',
      required: false,
    }),
    hash: Property.ShortText({
      displayName: 'Commit Hash',
      description: 'Optional commit hash to fetch a specific revision of the project.',
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const { projectId, branch, hash } = propsValue;

    const query: Record<string, string> = {};
    if (branch) query['branch'] = branch;
    if (hash) query['hash'] = hash;

    const result = await makeRequest(
      auth,
      HttpMethod.GET,
      `/projects/${projectId}/head`,
      undefined,
      query
    );

    return result;
  },
});
