import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { PromptHubAuth } from "../common/auth";

export const listProjects = createAction({
  auth: PromptHubAuth,
  name: 'listProjects',
  displayName: 'List Projects',
  description: 'Returns a list of projects for a given team, including details about each projects head revision.',
  props: {
    teamId: Property.ShortText({
      displayName: 'Team ID',
      description: 'Your PromptHub Team ID. You can find it in Team Settings or from the `/me` endpoint as `current_team_id`.',
      required: true,
    }),
    group: Property.ShortText({
      displayName: 'Group',
      description: 'Optional filter: list projects from a specific group.',
      required: false,
    }),
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Optional filter: list projects that use a specific model (e.g., gpt-4o-mini).',
      required: false,
    }),
    provider: Property.ShortText({
      displayName: 'Provider',
      description: 'Optional filter: list projects that use a specific model provider (OpenAI, Anthropic, Azure, Google, Amazon).',
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const { teamId, group, model, provider } = propsValue;

    const query: Record<string, string> = {};
    if (group) query['group'] = group;
    if (model) query['model'] = model;
    if (provider) query['provider'] = provider;

    const result = await makeRequest(
      auth,
      HttpMethod.GET,
      `/teams/${teamId}/projects`,
      undefined,
      query
    );

    return result;
  },
});
