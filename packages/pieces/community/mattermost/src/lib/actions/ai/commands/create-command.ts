import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostCreateCommandOutputSchema } from '../../../output-schemas';

export const createCommandAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_create_command',
  outputSchema: mattermostCreateCommandOutputSchema,
  displayName: 'Create Slash Command',
  description: 'Creates a custom slash command in a team.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a custom slash command in a team that calls the given URL when a user types "/<trigger>". Needs custom slash commands enabled on the server. Not idempotent: a trigger word already used in the team fails.',
    idempotent: false,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
    trigger: Property.ShortText({
      displayName: 'Trigger Word',
      description: 'Word that runs the command, without the leading "/", e.g. "deploy".',
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'Request URL',
      description: 'URL Mattermost calls when the command runs.',
      required: true,
    }),
    method: Property.StaticDropdown({
      displayName: 'Request Method',
      description: '"P" for POST, "G" for GET.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'POST', value: 'P' },
          { label: 'GET', value: 'G' },
        ],
      },
    }),
    displayName: Property.ShortText({
      displayName: 'Title',
      description: 'Command title shown in the integrations list.',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'What the command does.',
      required: false,
    }),
    username: Property.ShortText({
      displayName: 'Response Username',
      description: 'Username the command\'s responses are posted as.',
      required: false,
    }),
    autoComplete: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Autocomplete',
      description: '"true" to list the command in the slash-command autocomplete. Defaults to "false".',
    }),
    autoCompleteDesc: Property.ShortText({
      displayName: 'Autocomplete Description',
      description: 'Description shown in autocomplete.',
      required: false,
    }),
    autoCompleteHint: Property.ShortText({
      displayName: 'Autocomplete Hint',
      description: 'Argument hint shown in autocomplete, e.g. "[environment]".',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    if (p.method !== 'P' && p.method !== 'G') {
      throw new Error(`Request Method must be "P" or "G", got "${p.method}".`);
    }
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/commands',
      body: {
        team_id: p.teamId,
        trigger: p.trigger,
        url: p.url,
        method: p.method,
        display_name: p.displayName,
        description: p.description,
        username: p.username,
        auto_complete: mattermostUtils.parseBoolean({ value: p.autoComplete }),
        auto_complete_desc: p.autoCompleteDesc,
        auto_complete_hint: p.autoCompleteHint,
      },
    });
  },
});
